using SmartReview.Core.Entities;
using SmartReview.Core.Enums;

namespace SmartReview.Application.Interfaces;

public interface ISlmClient
{
    Task<List<AgentComment>> ExecuteAgentReviewAsync(
        AgentType agentType,
        string filePath,
        string prunedCodeContent,
        CancellationToken cancellationToken = default);
}
