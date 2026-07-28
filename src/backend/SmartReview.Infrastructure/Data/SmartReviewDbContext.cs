using Microsoft.EntityFrameworkCore;
using SmartReview.Core.Entities;

namespace SmartReview.Infrastructure.Data;

public class SmartReviewDbContext : DbContext
{
    public SmartReviewDbContext(DbContextOptions<SmartReviewDbContext> options) : base(options) { }

    public DbSet<PullRequestReview> PullRequestReviews => Set<PullRequestReview>();
    public DbSet<FileReviewItem> FileReviewItems => Set<FileReviewItem>();
    public DbSet<AgentComment> AgentComments => Set<AgentComment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<PullRequestReview>(builder =>
        {
            builder.HasKey(x => x.Id);
            builder.HasMany(x => x.FileReviews)
                   .WithOne()
                   .HasForeignKey(x => x.PullRequestReviewId)
                   .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<FileReviewItem>(builder =>
        {
            builder.HasKey(x => x.Id);
            builder.HasMany(x => x.Comments)
                   .WithOne()
                   .HasForeignKey(x => x.FileReviewItemId)
                   .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AgentComment>(builder =>
        {
            builder.HasKey(x => x.Id);
        });
    }
}
