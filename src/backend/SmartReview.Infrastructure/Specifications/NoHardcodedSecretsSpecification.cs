using System.Text.RegularExpressions;
using SmartReview.Core.Entities;
using SmartReview.Core.Specifications;

namespace SmartReview.Infrastructure.Specifications;

public class NoHardcodedSecretsSpecification : ISpecification<AgentComment>
{
    private static readonly Regex SecretPattern = new(
        @"(?i)(api[_-]?key|secret|password|passwd|private[_-]?key|access[_-]?token|bearer)\s*[:=]\s*[""']([a-zA-Z0-9_\-\.\~]{12,})[""']",
        RegexOptions.Compiled);

    public SpecificationResult IsSatisfiedBy(AgentComment comment)
    {
        var textToCheck = $"{comment.Message} {comment.SuggestedFix} {comment.CodeSnippet}";
        if (string.IsNullOrWhiteSpace(textToCheck)) return SpecificationResult.Success();

        if (SecretPattern.IsMatch(textToCheck))
        {
            return SpecificationResult.Failure("AI çıktısı sızdırılmış gizli bilgi veya API anahtarı içeriyor. Guardrail engeli tetiklendi.");
        }

        return SpecificationResult.Success();
    }
}
