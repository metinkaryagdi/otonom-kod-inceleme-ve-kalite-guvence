using SmartReview.Application.ACL.Models;

namespace SmartReview.Application.ACL;

public interface IHooksAntiCorruptionLayer
{
    NormalizedPullRequest TranslateWebhookPayload(string rawJsonPayload, string provider = "github");
}
