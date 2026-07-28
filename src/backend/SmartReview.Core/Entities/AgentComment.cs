using SmartReview.Core.Enums;

namespace SmartReview.Core.Entities;

public class AgentComment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid FileReviewItemId { get; set; }
    public AgentType Agent { get; set; }
    public int LineNumber { get; set; }
    public CommentSeverity Severity { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? CodeSnippet { get; set; }
    public string? SuggestedFix { get; set; }
    public bool PassedGuardrails { get; set; } = true;
    public string? GuardrailFailureReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
