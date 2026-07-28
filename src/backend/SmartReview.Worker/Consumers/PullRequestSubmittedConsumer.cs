using MassTransit;
using Microsoft.EntityFrameworkCore;
using SmartReview.Application.Events;
using SmartReview.Application.Strategies;
using SmartReview.Core.Enums;
using SmartReview.Infrastructure.Data;

namespace SmartReview.Worker.Consumers;

public class PullRequestSubmittedConsumer : IConsumer<PullRequestSubmittedEvent>
{
    private readonly SmartReviewDbContext _dbContext;
    private readonly IReviewStrategyResolver _strategyResolver;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<PullRequestSubmittedConsumer> _logger;

    public PullRequestSubmittedConsumer(
        SmartReviewDbContext dbContext,
        IReviewStrategyResolver strategyResolver,
        IPublishEndpoint publishEndpoint,
        ILogger<PullRequestSubmittedConsumer> logger)
    {
        _dbContext = dbContext;
        _strategyResolver = strategyResolver;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PullRequestSubmittedEvent> context)
    {
        var reviewId = context.Message.ReviewId;
        _logger.LogInformation("Processing PullRequestSubmittedEvent for ReviewId: {ReviewId}", reviewId);

        var review = await _dbContext.PullRequestReviews
            .Include(r => r.FileReviews)
            .FirstOrDefaultAsync(r => r.Id == reviewId);

        if (review == null) return;

        review.Status = ReviewStatus.AgentsExecuting;
        await _dbContext.SaveChangesAsync();

        foreach (var file in review.FileReviews)
        {
            var agents = _strategyResolver.ResolveAgents(file.FilePath, file.OriginalContent);
            foreach (var agent in agents)
            {
                await _publishEndpoint.Publish(new ExecuteAgentReviewCommand(
                    review.Id,
                    file.Id,
                    agent,
                    file.FilePath,
                    file.PrunedContent
                ));
            }
        }
    }
}
