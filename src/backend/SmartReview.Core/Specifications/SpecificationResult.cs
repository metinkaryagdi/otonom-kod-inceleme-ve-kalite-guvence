namespace SmartReview.Core.Specifications;

public class SpecificationResult
{
    public bool IsSatisfied { get; }
    public string? Reason { get; }

    private SpecificationResult(bool isSatisfied, string? reason)
    {
        IsSatisfied = isSatisfied;
        Reason = reason;
    }

    public static SpecificationResult Success() => new(true, null);
    public static SpecificationResult Failure(string reason) => new(false, reason);
}
