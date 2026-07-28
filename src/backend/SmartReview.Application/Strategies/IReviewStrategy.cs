using SmartReview.Core.Enums;

namespace SmartReview.Application.Strategies;

public interface IReviewStrategy
{
    string StrategyName { get; }
    bool CanHandle(string filePath, string fileContent);
    IEnumerable<AgentType> GetTargetAgents();
}

public interface IReviewStrategyResolver
{
    IEnumerable<AgentType> ResolveAgents(string filePath, string fileContent);
}
