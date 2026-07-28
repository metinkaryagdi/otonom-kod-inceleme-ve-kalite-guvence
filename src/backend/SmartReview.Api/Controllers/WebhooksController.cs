using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartReview.Application.ACL;
using SmartReview.Application.Events;
using SmartReview.Application.Interfaces;
using SmartReview.Application.Strategies;
using SmartReview.Core.Entities;
using SmartReview.Core.Enums;
using SmartReview.Infrastructure.Data;

namespace SmartReview.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController : ControllerBase
{
    private readonly IHooksAntiCorruptionLayer _acl;
    private readonly IAstPruningService _astPruningService;
    private readonly SmartReviewDbContext _dbContext;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(
        IHooksAntiCorruptionLayer acl,
        IAstPruningService astPruningService,
        SmartReviewDbContext dbContext,
        IPublishEndpoint publishEndpoint,
        ILogger<WebhooksController> logger)
    {
        _acl = acl;
        _astPruningService = astPruningService;
        _dbContext = dbContext;
        _publishEndpoint = publishEndpoint;
        _logger = logger;
    }

    [HttpPost("github")]
    public async Task<IActionResult> HandleGitHubWebhook([FromBody] object rawPayload)
    {
        var rawJson = rawPayload.ToString() ?? "{}";
        _logger.LogInformation("Received GitHub webhook payload.");

        var normalizedPr = _acl.TranslateWebhookPayload(rawJson, "github");

        var review = new PullRequestReview
        {
            RepositoryName = normalizedPr.RepositoryName,
            PullRequestId = normalizedPr.PullRequestId,
            Title = normalizedPr.Title,
            Author = normalizedPr.Author,
            SourceBranch = normalizedPr.SourceBranch,
            TargetBranch = normalizedPr.TargetBranch,
            Status = ReviewStatus.Received,
            CreatedAt = DateTime.UtcNow
        };

        // If no files present in payload, supply sample code file for demo testing
        if (!normalizedPr.Files.Any())
        {
            normalizedPr.Files.Add(new Application.ACL.Models.NormalizedCodeFile
            {
                FilePath = "Services/UserService.cs",
                Extension = ".cs",
                Status = "modified",
                FullContent = @"using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace EnterpriseApp.Services
{
    public class UserService
    {
        private readonly DbContext _context;
        public UserService(DbContext context) { _context = context; }

        public async Task<object> GetUserByEmail(string email)
        {
            // Vulnerable SQL query
            var sql = ""SELECT * FROM Users WHERE Email = '"" + email + ""'"";
            return await _context.Set<object>().FromSqlRaw(sql).FirstOrDefaultAsync();
        }

        public object GetUserSync(int id)
        {
            // Sync over async anti-pattern
            return GetUserByIdAsync(id).Result;
        }

        private async Task<object> GetUserByIdAsync(int id)
        {
            return await Task.FromResult(new { Id = id });
        }
    }"
            });
        }

        double totalSavings = 0;
        foreach (var f in normalizedPr.Files)
        {
            var pruningResult = _astPruningService.PruneCode(f.FullContent, f.FilePath);
            var fileItem = new FileReviewItem
            {
                PullRequestReviewId = review.Id,
                FilePath = f.FilePath,
                Language = f.Extension.TrimStart('.').ToUpper(),
                RawDiff = f.PatchOrDiff,
                OriginalContent = f.FullContent,
                PrunedContent = pruningResult.PrunedContent,
                OriginalTokenEstimate = pruningResult.OriginalTokenEstimate,
                PrunedTokenEstimate = pruningResult.PrunedTokenEstimate,
                TokenSavingsPercentage = pruningResult.TokenSavingsPercentage
            };
            review.FileReviews.Add(fileItem);
            totalSavings += pruningResult.TokenSavingsPercentage;
        }

        review.AverageTokenSavingsPercentage = review.FileReviews.Any() 
            ? Math.Round(totalSavings / review.FileReviews.Count, 1) 
            : 0;

        _dbContext.PullRequestReviews.Add(review);
        await _dbContext.SaveChangesAsync();

        // Publish event for Fan-Out background processing
        await _publishEndpoint.Publish(new PullRequestSubmittedEvent(review.Id));

        return Accepted(new
        {
            message = "Webhook accepted. Autonomous review pipeline launched.",
            reviewId = review.Id,
            status = review.Status.ToString()
        });
    }
}
