using SmartReview.Core.Entities;

namespace SmartReview.Application.Interfaces;

public interface ISupervisorSynthesizer
{
    Task<PullRequestReview> SynthesizeAsync(PullRequestReview review, CancellationToken cancellationToken = default);
}
