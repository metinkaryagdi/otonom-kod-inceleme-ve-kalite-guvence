using SmartReview.Application.Strategies;
using SmartReview.Core.Enums;

namespace SmartReview.Infrastructure.Strategies;

public class SqlSecurityReviewStrategy : IReviewStrategy
{
    public string StrategyName => "SQL Security Review Strategy";

    public bool CanHandle(string filePath, string fileContent)
    {
        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        return ext == ".sql" || fileContent.Contains("FromSqlRaw") || fileContent.Contains("ExecuteSqlRaw");
    }

    public IEnumerable<AgentType> GetTargetAgents()
    {
        yield return AgentType.Security;
    }
}

public class CleanCodeReviewStrategy : IReviewStrategy
{
    public string StrategyName => "C# Clean Code & Unit Test Strategy";

    public bool CanHandle(string filePath, string fileContent)
    {
        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        return ext == ".cs";
    }

    public IEnumerable<AgentType> GetTargetAgents()
    {
        yield return AgentType.Security;
        yield return AgentType.CleanCode;
        yield return AgentType.UnitTest;
    }
}

public class IgnoreReviewStrategy : IReviewStrategy
{
    public string StrategyName => "Ignore Static Assets Strategy";

    public bool CanHandle(string filePath, string fileContent)
    {
        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        var ignored = new[] { ".png", ".jpg", ".jpeg", ".ico", ".svg", ".json", ".lock", ".md" };
        return ignored.Contains(ext) || filePath.Contains("node_modules") || filePath.Contains("bin/");
    }

    public IEnumerable<AgentType> GetTargetAgents()
    {
        return Enumerable.Empty<AgentType>();
    }
}

public class ReviewStrategyResolver : IReviewStrategyResolver
{
    private readonly IEnumerable<IReviewStrategy> _strategies;

    public ReviewStrategyResolver(IEnumerable<IReviewStrategy> strategies)
    {
        _strategies = strategies;
    }

    public IEnumerable<AgentType> ResolveAgents(string filePath, string fileContent)
    {
        var ignore = _strategies.OfType<IgnoreReviewStrategy>().FirstOrDefault();
        if (ignore != null && ignore.CanHandle(filePath, fileContent))
        {
            return Enumerable.Empty<AgentType>();
        }

        var matchingAgents = new HashSet<AgentType>();
        foreach (var strategy in _strategies.Where(s => !(s is IgnoreReviewStrategy)))
        {
            if (strategy.CanHandle(filePath, fileContent))
            {
                foreach (var agent in strategy.GetTargetAgents())
                {
                    matchingAgents.Add(agent);
                }
            }
        }

        // Default if no strategy matched
        if (!matchingAgents.Any())
        {
            matchingAgents.Add(AgentType.Security);
            matchingAgents.Add(AgentType.CleanCode);
        }

        return matchingAgents;
    }
}
