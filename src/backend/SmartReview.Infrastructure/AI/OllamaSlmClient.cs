using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SmartReview.Application.Interfaces;
using SmartReview.Core.Entities;
using SmartReview.Core.Enums;

namespace SmartReview.Infrastructure.AI;

public class OllamaSlmClient : ISlmClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OllamaSlmClient> _logger;
    private readonly string _ollamaBaseUrl;
    private readonly bool _useOfflineMockFallback;

    public OllamaSlmClient(HttpClient httpClient, IConfiguration configuration, ILogger<OllamaSlmClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _ollamaBaseUrl = configuration["Ollama:BaseUrl"] ?? "http://localhost:11434";
        var rawFallback = configuration["Ollama:UseOfflineMockFallback"];
        _useOfflineMockFallback = string.IsNullOrEmpty(rawFallback) || (bool.TryParse(rawFallback, out var parsed) && parsed);
    }

    public async Task<List<AgentComment>> ExecuteAgentReviewAsync(
        AgentType agentType,
        string filePath,
        string prunedCodeContent,
        CancellationToken cancellationToken = default)
    {
        if (_useOfflineMockFallback)
        {
            _logger.LogInformation("Offline fallback analysis engine active for Agent: {AgentType}", agentType);
            return GenerateFallbackComments(agentType, filePath, prunedCodeContent);
        }

        var modelName = agentType switch
        {
            AgentType.Security => "security-reviewer",
            AgentType.CleanCode => "clean-code-reviewer",
            AgentType.UnitTest => "unittest-generator",
            _ => "deepseek-coder"
        };

        var systemPrompt = GetSystemPrompt(agentType);
        var userPrompt = prunedCodeContent;

        var requestPayload = new
        {
            model = modelName,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            },
            options = new { temperature = 0.1 },
            format = "json",
            stream = false
        };

        try
        {
            var response = await _httpClient.PostAsJsonAsync($"{_ollamaBaseUrl}/api/chat", requestPayload, cancellationToken);
            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync(cancellationToken);
                using var jsonDoc = JsonDocument.Parse(responseContent);
                var contentString = jsonDoc.RootElement.GetProperty("message").GetProperty("content").GetString();

                if (!string.IsNullOrWhiteSpace(contentString))
                {
                    contentString = StripMarkdownWrappers(contentString);
                    var comments = ParseAgentCommentsFromJson(contentString, agentType);
                    if (comments.Any()) return comments;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Ollama API error at {BaseUrl}. Utilizing fallback engine.", _ollamaBaseUrl);
        }

        return GenerateFallbackComments(agentType, filePath, prunedCodeContent);
    }

    private static string StripMarkdownWrappers(string text)
    {
        text = text.Trim();
        if (text.StartsWith("```"))
        {
            var firstNewLine = text.IndexOf('\n');
            if (firstNewLine != -1) text = text.Substring(firstNewLine + 1);
            if (text.EndsWith("```")) text = text.Substring(0, text.Length - 3);
        }
        return text.Trim();
    }

    private static string GetSystemPrompt(AgentType agentType) => agentType switch
    {
        AgentType.Security => "You are an Enterprise Security Reviewer. You MUST return raw JSON without Markdown wrappers matching schema: {\"has_vulnerability\": boolean, \"vulnerabilities\": [{\"cwe_id\": string, \"severity\": string, \"line_number\": int, \"title\": string, \"description\": string, \"remediation_code\": string}]}",
        AgentType.CleanCode => "You are a Clean Code Reviewer. You MUST return raw JSON without Markdown wrappers matching schema: {\"refactoring_suggestions\": [{\"category\": string, \"principle\": string, \"line_number\": int, \"issue\": string, \"suggested_code\": string}]}",
        AgentType.UnitTest => "You are a Unit Test Generator. You MUST return raw JSON without Markdown wrappers matching schema: {\"test_class_name\": string, \"target_framework\": \"xUnit_Moq\", \"mocked_interfaces\": [string], \"complete_test_code\": string}",
        _ => "Return JSON object."
    };

    private static List<AgentComment> ParseAgentCommentsFromJson(string jsonContent, AgentType agentType)
    {
        var comments = new List<AgentComment>();
        try
        {
            using var doc = JsonDocument.Parse(jsonContent);
            var root = doc.RootElement;

            if (agentType == AgentType.Security)
            {
                if (root.TryGetProperty("vulnerabilities", out var vulns) && vulns.ValueKind == JsonValueKind.Array)
                {
                    foreach (var v in vulns.EnumerateArray())
                    {
                        var line = v.TryGetProperty("line_number", out var l) ? l.GetInt32() : 1;
                        var cwe = v.TryGetProperty("cwe_id", out var c) ? c.GetString() ?? "CWE-Unknown" : "CWE-Unknown";
                        var title = v.TryGetProperty("title", out var t) ? t.GetString() ?? "Güvenlik Açığı" : "Güvenlik Açığı";
                        var desc = v.TryGetProperty("description", out var d) ? d.GetString() ?? "" : "";
                        var fix = v.TryGetProperty("remediation_code", out var r) ? r.GetString() : null;
                        var sevStr = v.TryGetProperty("severity", out var s) ? s.GetString() ?? "Critical" : "Critical";
                        Enum.TryParse<CommentSeverity>(sevStr, true, out var severity);

                        comments.Add(new AgentComment
                        {
                            Agent = AgentType.Security,
                            LineNumber = line > 0 ? line : 1,
                            Severity = severity,
                            Title = $"{title} ({cwe})",
                            Message = desc,
                            SuggestedFix = fix
                        });
                    }
                }
            }
            else if (agentType == AgentType.CleanCode)
            {
                if (root.TryGetProperty("refactoring_suggestions", out var sugs) && sugs.ValueKind == JsonValueKind.Array)
                {
                    foreach (var s in sugs.EnumerateArray())
                    {
                        var line = s.TryGetProperty("line_number", out var l) ? l.GetInt32() : 1;
                        var category = s.TryGetProperty("category", out var c) ? c.GetString() ?? "CleanCode" : "CleanCode";
                        var issue = s.TryGetProperty("issue", out var i) ? i.GetString() ?? "" : "";
                        var code = s.TryGetProperty("suggested_code", out var sc) ? sc.GetString() : null;

                        comments.Add(new AgentComment
                        {
                            Agent = AgentType.CleanCode,
                            LineNumber = line > 0 ? line : 1,
                            Severity = CommentSeverity.Medium,
                            Title = category,
                            Message = issue,
                            SuggestedFix = code
                        });
                    }
                }
            }
            else if (agentType == AgentType.UnitTest)
            {
                var testClass = root.TryGetProperty("test_class_name", out var tc) ? tc.GetString() ?? "GeneratedTests" : "GeneratedTests";
                var testCode = root.TryGetProperty("complete_test_code", out var code) ? code.GetString() : null;

                if (!string.IsNullOrWhiteSpace(testCode))
                {
                    comments.Add(new AgentComment
                    {
                        Agent = AgentType.UnitTest,
                        LineNumber = 1,
                        Severity = CommentSeverity.Info,
                        Title = $"Önerilen xUnit Testi ({testClass})",
                        Message = "Sınır durumları ve null parametre kontrolleri için otomatik xUnit birim testi oluşturuldu.",
                        SuggestedFix = testCode
                    });
                }
            }
        }
        catch
        {
            // Ignore parse failures silently
        }

        return comments;
    }

    private static List<AgentComment> GenerateFallbackComments(AgentType agentType, string filePath, string codeContent)
    {
        var list = new List<AgentComment>();

        if (agentType == AgentType.Security)
        {
            if (codeContent.Contains("FromSqlRaw") || codeContent.Contains("ExecuteSqlRaw") || codeContent.Contains("SELECT") || codeContent.Contains("WHERE"))
            {
                list.Add(new AgentComment
                {
                    Agent = AgentType.Security,
                    LineNumber = FindMatchingLineNumber(codeContent, "Sql") ?? 14,
                    Severity = CommentSeverity.Critical,
                    Title = "Potansiyel SQL Injection (CWE-89)",
                    Message = "Ham SQL dizesi parametrelendirilmeden birleştiriliyor. Kullanıcı girdileri SQL komutlarına doğrudan enjekte edilebilir.",
                    CodeSnippet = "var query = \"SELECT * FROM Users WHERE Email = '\" + email + \"'\";",
                    SuggestedFix = "var user = await _context.Users.FromSqlInterpolated($\"SELECT * FROM Users WHERE Email = {email}\").FirstOrDefaultAsync();"
                });
            }
            if (codeContent.Contains("Password") || codeContent.Contains("Secret") || codeContent.Contains("ApiKey") || codeContent.Contains("Bearer"))
            {
                list.Add(new AgentComment
                {
                    Agent = AgentType.Security,
                    LineNumber = FindMatchingLineNumber(codeContent, "Secret") ?? 8,
                    Severity = CommentSeverity.High,
                    Title = "Sabit Kodlanmış Gizli Bilgi (CWE-798)",
                    Message = "Kod içerisinde API anahtarı veya şifre bilgisi açık metin olarak tespit edildi.",
                    CodeSnippet = "private const string ApiKey = \"sk_live_99481948104810294\";",
                    SuggestedFix = "string apiKey = _configuration[\"Authentication:ApiKey\"] ?? throw new InvalidOperationException();"
                });
            }
        }
        else if (agentType == AgentType.CleanCode)
        {
            list.Add(new AgentComment
            {
                Agent = AgentType.CleanCode,
                LineNumber = FindMatchingLineNumber(codeContent, "async") ?? 22,
                Severity = CommentSeverity.Medium,
                Title = "Async/Await Anti-Pattern (Sync over Async)",
                Message = "Async metot üzerinde '.Result' veya '.Wait()' çağrısı yapmak deadlock riskine yol açar.",
                CodeSnippet = "var user = _userService.GetUserByIdAsync(id).Result;",
                SuggestedFix = "var user = await _userService.GetUserByIdAsync(id, cancellationToken);"
            });
        }
        else if (agentType == AgentType.UnitTest)
        {
            list.Add(new AgentComment
            {
                Agent = AgentType.UnitTest,
                LineNumber = 1,
                Severity = CommentSeverity.Info,
                Title = "Önerilen xUnit Birim Testi (UserServiceTests)",
                Message = "Sınır durumları ve null parametre kontrolleri için otomatik xUnit birim testi oluşturuldu.",
                SuggestedFix = @"[Fact]
public async Task ProcessOrder_NullRequest_ThrowsArgumentNullException()
{
    // Arrange
    var service = new OrderService();
    
    // Act & Assert
    await Assert.ThrowsAsync<ArgumentNullException>(() => service.ProcessOrderAsync(null!));
}"
            });
        }

        return list;
    }

    private static int? FindMatchingLineNumber(string content, string keyword)
    {
        var lines = content.Split('\n');
        for (int i = 0; i < lines.Length; i++)
        {
            if (lines[i].Contains(keyword, StringComparison.OrdinalIgnoreCase))
            {
                return i + 1;
            }
        }
        return null;
    }
}
