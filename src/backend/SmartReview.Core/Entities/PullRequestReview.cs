using SmartReview.Core.Enums;

namespace SmartReview.Core.Entities;

public class PullRequestReview
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string RepositoryName { get; set; } = string.Empty;
    public int PullRequestId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string SourceBranch { get; set; } = string.Empty;
    public string TargetBranch { get; set; } = string.Empty;
    public ReviewStatus Status { get; set; } = ReviewStatus.Received;
    public double AverageTokenSavingsPercentage { get; set; }
    public string? ExecutiveSummary { get; set; }
    public List<FileReviewItem> FileReviews { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
