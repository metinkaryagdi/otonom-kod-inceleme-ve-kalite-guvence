export interface AgentComment {
  id: string;
  fileReviewItemId: string;
  agent: number; // 0: Security, 1: CleanCode, 2: UnitTest, 3: Supervisor
  lineNumber: number;
  severity: number; // 0: Info, 1: Low, 2: Medium, 3: High, 4: Critical
  title: string;
  message: string;
  codeSnippet?: string;
  suggestedFix?: string;
  passedGuardrails: boolean;
  guardrailFailureReason?: string;
  createdAt: string;
}

export interface FileReviewItem {
  id: string;
  pullRequestReviewId: string;
  filePath: string;
  language: string;
  rawDiff: string;
  originalContent: string;
  prunedContent: string;
  originalTokenEstimate: number;
  prunedTokenEstimate: number;
  tokenSavingsPercentage: number;
  comments: AgentComment[];
}

export interface PullRequestReview {
  id: string;
  repositoryName: string;
  pullRequestId: number;
  title: string;
  author: string;
  sourceBranch: string;
  targetBranch: string;
  status: number; // 0: Received, 1: Pruning, 2: AgentsExecuting, 3: GuardrailFiltering, 4: SupervisorSynthesizing, 5: Completed, 6: Failed
  averageTokenSavingsPercentage: number;
  executiveSummary?: string;
  fileReviews: FileReviewItem[];
  createdAt: string;
  completedAt?: string;
}

export interface DashboardStats {
  totalReviews: number;
  criticalBlocked: number;
  unitTestsGenerated: number;
  avgTokenSavingsPct: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export async function fetchAllReviews(): Promise<PullRequestReview[]> {
  try {
    const res = await fetch(`${API_BASE}/reviews`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch reviews");
    return await res.json();
  } catch (err) {
    console.warn("API Offline, returning mock fallback data", err);
    return getMockReviews();
  }
}

export async function fetchReviewById(id: string): Promise<PullRequestReview | null> {
  try {
    const res = await fetch(`${API_BASE}/reviews/${id}`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch review");
    return await res.json();
  } catch (err) {
    console.warn("API Offline, returning mock single review", err);
    return getMockReviews().find((r) => r.id === id) || getMockReviews()[0];
  }
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await fetch(`${API_BASE}/reviews/stats`, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch stats");
    return await res.json();
  } catch (err) {
    return {
      totalReviews: 18,
      criticalBlocked: 12,
      unitTestsGenerated: 24,
      avgTokenSavingsPct: 52.4,
    };
  }
}

export async function triggerSimulatedPR(): Promise<{ reviewId: string }> {
  const res = await fetch(`${API_BASE}/reviews/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to simulate PR");
  return await res.json();
}

export async function submitCustomCode(filePath: string, code: string, title?: string): Promise<{ reviewId: string }> {
  const res = await fetch(`${API_BASE}/reviews/custom`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filePath, code, title }),
  });
  if (!res.ok) throw new Error("Failed to submit custom code");
  return await res.json();
}

function getMockReviews(): PullRequestReview[] {
  return [
    {
      id: "f83a48e2-1049-4109-8472-91823a019481",
      repositoryName: "enterprise/payment-gateway",
      pullRequestId: 412,
      title: "Feature: Refactor UserService and add SQL Audit Queries",
      author: "dev-lead",
      sourceBranch: "feature/user-auth-refactor",
      targetBranch: "main",
      status: 5,
      averageTokenSavingsPercentage: 48.5,
      executiveSummary: `# 🛡️ Otonom Kod İnceleme Özeti - PR #412\n\n> [!CAUTION]\n> **Kritik Güvenlik Açığı Tespiti!** 1 adet kritik seviye bulgu engellendi.\n\n- 🔴 **Security SLM:** Potential SQL Injection (CWE-89) detected.\n- 🔵 **Clean Code SLM:** Async/Await anti-pattern (Sync over async deadlock risk).\n- 🟢 **Unit Test Generator:** Auto-generated xUnit test suite passed Roslyn compilation.`,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      fileReviews: [
        {
          id: "f1",
          pullRequestReviewId: "f83a48e2-1049-4109-8472-91823a019481",
          filePath: "Services/UserService.cs",
          language: "CS",
          rawDiff: "+ public async Task<object> GetUserByEmail(string email)...",
          originalContent: `using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseApp.Services
{
    public class UserService
    {
        private readonly DbContext _context;
        private const string SecretKey = "sk_live_99481948104810294";

        public UserService(DbContext context) { _context = context; }

        public async Task<object> GetUserByEmail(string email)
        {
            // Vulnerable SQL query
            var sql = "SELECT * FROM Users WHERE Email = '" + email + "'";
            return await _context.Set<object>().FromSqlRaw(sql).FirstOrDefaultAsync();
        }

        public object GetUserSync(int id)
        {
            // Sync over async anti-pattern
            return GetUserByIdAsync(id).Result;
        }

        private async Task<object> GetUserByIdAsync(int id)
        {
            return await Task.FromResult(new { Id = id });
        }
    }
}`,
          prunedContent: `public class UserService
{
    private readonly DbContext _context;
    public UserService(DbContext context) { _context = context; }
    public async Task<object> GetUserByEmail(string email)
    {
        var sql = "SELECT * FROM Users WHERE Email = '" + email + "'";
        return await _context.Set<object>().FromSqlRaw(sql).FirstOrDefaultAsync();
    }
    public object GetUserSync(int id)
    {
        return GetUserByIdAsync(id).Result;
    }
}`,
          originalTokenEstimate: 340,
          prunedTokenEstimate: 175,
          tokenSavingsPercentage: 48.5,
          comments: [
            {
              id: "c1",
              fileReviewItemId: "f1",
              agent: 0, // Security
              lineNumber: 16,
              severity: 4, // Critical
              title: "Potansiyel SQL Injection (CWE-89)",
              message: "Ham SQL dizesi parametrelendirilmeden birleştiriliyor. Kullanıcı girdileri SQL komutlarına doğrudan enjekte edilebilir.",
              codeSnippet: `var sql = "SELECT * FROM Users WHERE Email = '" + email + "'";`,
              suggestedFix: `var user = await _context.Users.FromSqlInterpolated($"SELECT * FROM Users WHERE Email = {email}").FirstOrDefaultAsync();`,
              passedGuardrails: true,
              createdAt: new Date().toISOString(),
            },
            {
              id: "c2",
              fileReviewItemId: "f1",
              agent: 1, // CleanCode
              lineNumber: 22,
              severity: 2, // Medium
              title: "Async/Await Anti-Pattern (Sync over Async)",
              message: "Async metot üzerinde '.Result' veya '.Wait()' çağrısı yapmak deadlock riskine yol açar.",
              codeSnippet: `return GetUserByIdAsync(id).Result;`,
              suggestedFix: `return await GetUserByIdAsync(id, cancellationToken);`,
              passedGuardrails: true,
              createdAt: new Date().toISOString(),
            },
            {
              id: "c3",
              fileReviewItemId: "f1",
              agent: 2, // UnitTest
              lineNumber: 1,
              severity: 0, // Info
              title: "Önerilen xUnit Birim Testi",
              message: "GetUserByEmail metodu için otomatik birim testi kurgulandı.",
              suggestedFix: `[Fact]
public async Task GetUserByEmail_ValidEmail_ReturnsUser()
{
    // Arrange
    var dbMock = new Mock<DbContext>();
    var service = new UserService(dbMock.Object);
    
    // Act
    var result = await service.GetUserByEmail("test@enterprise.com");
    
    // Assert
    Assert.NotNull(result);
}`,
              passedGuardrails: true,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      ],
    },
  ];
}
