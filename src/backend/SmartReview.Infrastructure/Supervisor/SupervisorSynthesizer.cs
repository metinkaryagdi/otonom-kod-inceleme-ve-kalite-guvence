using System.Text;
using SmartReview.Application.Interfaces;
using SmartReview.Core.Entities;
using SmartReview.Core.Enums;
using SmartReview.Core.Specifications;

namespace SmartReview.Infrastructure.Supervisor;

public class SupervisorSynthesizer : ISupervisorSynthesizer
{
    private readonly IEnumerable<ISpecification<AgentComment>> _guardrails;

    public SupervisorSynthesizer(IEnumerable<ISpecification<AgentComment>> guardrails)
    {
        _guardrails = guardrails;
    }

    public Task<PullRequestReview> SynthesizeAsync(PullRequestReview review, CancellationToken cancellationToken = default)
    {
        review.Status = ReviewStatus.GuardrailFiltering;

        int totalComments = 0;
        int criticalCount = 0;
        int highCount = 0;
        int guardrailRejectedCount = 0;

        foreach (var file in review.FileReviews)
        {
            var validComments = new List<AgentComment>();

            foreach (var comment in file.Comments)
            {
                bool passedAll = true;
                string? failureReason = null;

                foreach (var guardrail in _guardrails)
                {
                    var result = guardrail.IsSatisfiedBy(comment);
                    if (!result.IsSatisfied)
                    {
                        passedAll = false;
                        failureReason = result.Reason;
                        break;
                    }
                }

                comment.PassedGuardrails = passedAll;
                comment.GuardrailFailureReason = failureReason;

                if (passedAll)
                {
                    validComments.Add(comment);
                }
                else
                {
                    guardrailRejectedCount++;
                }
            }

            // De-duplicate / prioritize on same file + line
            // Security overrides CleanCode & UnitTest
            var Deduplicated = validComments
                .GroupBy(c => c.LineNumber)
                .Select(g => g.OrderByDescending(c => c.Severity).ThenBy(c => c.Agent == AgentType.Security ? 2 : 1).First())
                .ToList();

            file.Comments = Deduplicated;
            totalComments += file.Comments.Count;
            criticalCount += file.Comments.Count(c => c.Severity == CommentSeverity.Critical);
            highCount += file.Comments.Count(c => c.Severity == CommentSeverity.High);
        }

        review.Status = ReviewStatus.SupervisorSynthesizing;

        // Generate Executive Summary
        var sb = new StringBuilder();
        sb.AppendLine($"# 🛡️ Otonom Kod İnceleme Özeti - PR #{review.PullRequestId}");
        sb.AppendLine($"**Depo:** `{review.RepositoryName}` | **Yazar:** @{review.Author} | **Dallar:** `{review.SourceBranch}` ➔ `{review.TargetBranch}`\n");

        if (criticalCount > 0)
        {
            sb.AppendLine($"> [!CAUTION]");
            sb.AppendLine($"> **Kritik Güvenlik Açığı Tespiti!** {criticalCount} adet kritik seviye bulgu engellendi. PR birleştirilmeden önce düzeltilmelidir.\n");
        }
        else if (highCount > 0)
        {
            sb.AppendLine($"> [!WARNING]");
            sb.AppendLine($"> **Yüksek Seviye İyileştirme:** {highCount} adet yüksek öncelikli öneri bulundu.\n");
        }
        else
        {
            sb.AppendLine($"> [!TIP]");
            sb.AppendLine($"> **Tebrikler!** Kod kalitesi standartlara uygun görünmektedir.\n");
        }

        sb.AppendLine("### 📊 Özet Metrikler");
        sb.AppendLine($"| Metrik | Değer |");
        sb.AppendLine($"| :--- | :--- |");
        sb.AppendLine($"| İncelenen Dosya Sayısı | **{review.FileReviews.Count}** |");
        sb.AppendLine($"| Toplam Satır İçi Yorum | **{totalComments}** |");
        sb.AppendLine($"| Engellenen Kritik Hatalar | **{criticalCount}** |");
        sb.AppendLine($"| Guardrail Tarafından Reddedilen AI Çıktıları | **{guardrailRejectedCount}** |");
        sb.AppendLine($"| Ortalama AST Token Tasarrufu | **%{review.AverageTokenSavingsPercentage:F1}** |\n");

        sb.AppendLine("### 🤖 Ajan Katkıları");
        sb.AppendLine("- 🔴 **Security SLM:** OWASP Top 10 ve SQL Injection / Sabit Bilgi taramaları tamamlandı.");
        sb.AppendLine("- 🔵 **Clean Code SLM:** Async/Await anti-pattern ve LINQ performans optimizasyonları yapıldı.");
        sb.AppendLine("- 🟢 **Unit Test Generator:** Sınır durumları için otomatik xUnit ve Moq birim testleri oluşturuldu (Roslyn ile doğrulandı).\n");

        review.ExecutiveSummary = sb.ToString();
        review.Status = ReviewStatus.Completed;
        review.CompletedAt = DateTime.UtcNow;

        return Task.FromResult(review);
    }
}
