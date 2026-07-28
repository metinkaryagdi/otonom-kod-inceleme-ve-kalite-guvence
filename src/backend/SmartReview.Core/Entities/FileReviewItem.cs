namespace SmartReview.Core.Entities;

public class FileReviewItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PullRequestReviewId { get; set; }
    public string FilePath { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string RawDiff { get; set; } = string.Empty;
    public string OriginalContent { get; set; } = string.Empty;
    public string PrunedContent { get; set; } = string.Empty;
    public int OriginalTokenEstimate { get; set; }
    public int PrunedTokenEstimate { get; set; }
    public double TokenSavingsPercentage { get; set; }
    public List<AgentComment> Comments { get; set; } = new();
}
