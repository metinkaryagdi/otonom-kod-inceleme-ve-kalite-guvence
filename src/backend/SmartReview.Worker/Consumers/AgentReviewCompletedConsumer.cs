using MassTransit;
using Microsoft.EntityFrameworkCore;
using SmartReview.Application.Events;
using SmartReview.Application.Interfaces;
using SmartReview.Core.Enums;
using SmartReview.Infrastructure.Data;

namespace SmartReview.Worker.Consumers;

public class AgentReviewCompletedConsumer : IConsumer<AgentReviewCompletedEvent>
{
    private readonly SmartReviewDbContext _dbContext;
    private readonly ISupervisorSynthesizer _supervisorSynthesizer;
    private readonly ILogger<AgentReviewCompletedConsumer> _logger;

    public AgentReviewCompletedConsumer(
        SmartReviewDbContext dbContext,
        ISupervisorSynthesizer supervisorSynthesizer,
        ILogger<AgentReviewCompletedConsumer> logger)
    {
        _dbContext = dbContext;
        _supervisorSynthesizer = supervisorSynthesizer;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<AgentReviewCompletedEvent> context)
    {
        var msg = context.Message;
        _logger.LogInformation("Agent {Agent} completed review for ReviewId: {ReviewId}", msg.Agent, msg.ReviewId);

        var review = await _dbContext.PullRequestReviews
            .Include(r => r.FileReviews)
                .ThenInclude(f => f.Comments)
            .FirstOrDefaultAsync(r => r.Id == msg.ReviewId);

        if (review == null) return;

        // Perform Supervisor Synthesis & Guardrail filtering
        await _supervisorSynthesizer.SynthesizeAsync(review, context.CancellationToken);
        await _dbContext.SaveChangesAsync();

        _logger.LogInformation("Autonomous review pipeline completed for PR #{PullRequestId}", review.PullRequestId);
    }
}
