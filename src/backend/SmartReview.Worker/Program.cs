using MassTransit;
using Microsoft.EntityFrameworkCore;
using SmartReview.Application.Interfaces;
using SmartReview.Application.Strategies;
using SmartReview.Core.Entities;
using SmartReview.Core.Specifications;
using SmartReview.Infrastructure.AI;
using SmartReview.Infrastructure.AST;
using SmartReview.Infrastructure.Data;
using SmartReview.Infrastructure.Specifications;
using SmartReview.Infrastructure.Strategies;
using SmartReview.Infrastructure.Supervisor;
using SmartReview.Worker.Consumers;

var builder = Host.CreateApplicationBuilder(args);

// Shared Database Setup
var dataDir = Environment.GetEnvironmentVariable("DATA_DIR") ?? AppContext.BaseDirectory;
Directory.CreateDirectory(dataDir);
var dbPath = Path.Combine(dataDir, "smart_review.db");
builder.Services.AddDbContext<SmartReviewDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// Infrastructure & AI Services
builder.Services.AddHttpClient<ISlmClient, OllamaSlmClient>();
builder.Services.AddSingleton<IAstPruningService, RoslynAstPruningService>();
builder.Services.AddSingleton<IReviewStrategy, SqlSecurityReviewStrategy>();
builder.Services.AddSingleton<IReviewStrategy, CleanCodeReviewStrategy>();
builder.Services.AddSingleton<IReviewStrategy, IgnoreReviewStrategy>();
builder.Services.AddSingleton<IReviewStrategyResolver, ReviewStrategyResolver>();

// Guardrail Specifications
builder.Services.AddSingleton<ISpecification<AgentComment>, ValidRoslynSyntaxSpecification>();
builder.Services.AddSingleton<ISpecification<AgentComment>, NoHardcodedSecretsSpecification>();
builder.Services.AddTransient<ISupervisorSynthesizer, SupervisorSynthesizer>();

// MassTransit Consumers & EventBus Setup (RabbitMQ with InMemory Fallback)
var rabbitHost = builder.Configuration["RabbitMQ:Host"];
builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<PullRequestSubmittedConsumer>();
    x.AddConsumer<ExecuteAgentReviewConsumer>();
    x.AddConsumer<AgentReviewCompletedConsumer>();

    if (!string.IsNullOrEmpty(rabbitHost))
    {
        x.UsingRabbitMq((context, cfg) =>
        {
            cfg.Host(rabbitHost, "/", h =>
            {
                h.Username("guest");
                h.Password("guest");
            });
            cfg.ConfigureEndpoints(context);
        });
    }
    else
    {
        x.UsingInMemory((context, cfg) =>
        {
            cfg.ConfigureEndpoints(context);
        });
    }
});

var host = builder.Build();

// Ensure DB Created
using (var scope = host.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SmartReviewDbContext>();
    db.Database.EnsureCreated();
}

host.Run();
