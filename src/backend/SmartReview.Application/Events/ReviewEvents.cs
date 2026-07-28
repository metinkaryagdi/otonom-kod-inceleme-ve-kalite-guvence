using SmartReview.Core.Entities;
using SmartReview.Core.Enums;

namespace SmartReview.Application.Events;

public record PullRequestSubmittedEvent(Guid ReviewId);

public record ExecuteAgentReviewCommand(
    Guid ReviewId,
    Guid FileReviewId,
    AgentType Agent,
    string FilePath,
    string PrunedContent
);

public record AgentReviewCompletedEvent(
    Guid ReviewId,
    Guid FileReviewId,
    AgentType Agent,
    List<AgentComment> Comments
);

public record AllAgentsCompletedEvent(Guid ReviewId);
