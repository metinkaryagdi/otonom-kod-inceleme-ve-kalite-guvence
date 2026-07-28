using Microsoft.AspNetCore.SignalR;

namespace SmartReview.Api.Hubs;

public interface IReviewProgressClient
{
    Task ReceiveProgressUpdate(object progressData);
    Task ReceiveReviewCompleted(object reviewSummaryData);
}

public class ReviewProgressHub : Hub<IReviewProgressClient>
{
    public async Task JoinReviewGroup(string reviewId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"review-{reviewId}");
    }

    public async Task LeaveReviewGroup(string reviewId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"review-{reviewId}");
    }
}
