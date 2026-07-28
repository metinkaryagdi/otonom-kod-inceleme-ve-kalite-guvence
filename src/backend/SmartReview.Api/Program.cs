using MassTransit;
using Microsoft.EntityFrameworkCore;
using SmartReview.Api.Hubs;
using SmartReview.Application.ACL;
using SmartReview.Application.Interfaces;
using SmartReview.Application.Strategies;
using SmartReview.Infrastructure.ACL;
using SmartReview.Infrastructure.AST;
using SmartReview.Infrastructure.Data;
using SmartReview.Infrastructure.Strategies;

var builder = WebApplication.CreateBuilder(args);

// Add Services to DI
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", policy =>
    {
        policy.AllowAnyHeader()
              .AllowAnyMethod()
              .SetIsOriginAllowed(_ => true)
              .AllowCredentials();
    });
});

// Shared Database Setup
var dataDir = Environment.GetEnvironmentVariable("DATA_DIR") ?? AppContext.BaseDirectory;
Directory.CreateDirectory(dataDir);
var dbPath = Path.Combine(dataDir, "smart_review.db");
builder.Services.AddDbContext<SmartReviewDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath}"));

// Domain & Infrastructure Services
builder.Services.AddSingleton<IHooksAntiCorruptionLayer, GitHubAntiCorruptionLayer>();
builder.Services.AddSingleton<IAstPruningService, RoslynAstPruningService>();
builder.Services.AddSingleton<IReviewStrategy, SqlSecurityReviewStrategy>();
builder.Services.AddSingleton<IReviewStrategy, CleanCodeReviewStrategy>();
builder.Services.AddSingleton<IReviewStrategy, IgnoreReviewStrategy>();
builder.Services.AddSingleton<IReviewStrategyResolver, ReviewStrategyResolver>();

// MassTransit EventBus Setup (RabbitMQ with InMemory Fallback)
var rabbitHost = builder.Configuration["RabbitMQ:Host"];
builder.Services.AddMassTransit(x =>
{
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

var app = builder.Build();

// Auto Migrate Database
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SmartReviewDbContext>();
    db.Database.EnsureCreated();
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("CorsPolicy");
app.UseAuthorization();
app.MapControllers();
app.MapHub<ReviewProgressHub>("/hubs/review-progress");

app.Run();
