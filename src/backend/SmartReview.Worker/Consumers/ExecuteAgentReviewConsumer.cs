using MassTransit;
using Microsoft.EntityFrameworkCore;
using SmartReview.Application.Events;
using SmartReview.Application.Interfaces;
using SmartReview.Core.Entities;
using SmartReview.Infrastructure.Data;

namespace SmartReview.Worker.Consumers;

public class ExecuteAgentReviewConsumer : IConsumer<ExecuteAgentReviewCommand>
{
    private readonly ISlmClient _slmClient;
    private readonly SmartReviewDbContext _dbContext;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<ExecuteAgentReviewConsumer> _logger;

    public ExecuteAgentReviewConsumer(
        ISlmClient slmClient,
        SmartReviewDbContext dbContext,
        IPublishEndpoint publishEndpoint,
        ILogger<ExecuteAgentReviewConsumer> logger)
    {
        _slmClient = slmClient;
        _dbContext = dbContext;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<ExecuteAgentReviewCommand> context)
    {
        var msg = context.Message;
        _logger.LogInformation("Executing Agent Review: {Agent} for file {FilePath}", msg.Agent, msg.FilePath);

        var comments = await _slmClient.ExecuteAgentReviewAsync(
            msg.Agent,
            msg.FilePath,
            msg.PrunedContent,
            context.CancellationToken);

        var fileItem = await _dbContext.FileReviewItems.FirstOrDefaultAsync(f => f.Id == msg.FileReviewId);
        if (fileItem != null)
        {
            foreach (var comment in comments)
            {
                comment.FileReviewItemId = fileItem.Id;
                _dbContext.AgentComments.Add(comment);
            }
            await _dbContext.SaveChangesAsync();
        }

        await _publishEndpoint.Publish(new AgentReviewCompletedEvent(
            msg.ReviewId,
            msg.FileReviewId,
            msg.Agent,
            comments
        ));
    }
}
