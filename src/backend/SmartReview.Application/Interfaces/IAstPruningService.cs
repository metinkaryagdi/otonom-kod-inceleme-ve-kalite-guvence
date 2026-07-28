namespace SmartReview.Application.Interfaces;

public record PruningResult(
    string PrunedContent,
    int OriginalTokenEstimate,
    int PrunedTokenEstimate,
    double TokenSavingsPercentage
);

public interface IAstPruningService
{
    PruningResult PruneCode(string codeContent, string filePath);
}
