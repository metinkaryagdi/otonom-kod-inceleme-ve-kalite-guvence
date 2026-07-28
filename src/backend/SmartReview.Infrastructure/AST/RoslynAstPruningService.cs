using System.Text;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using SmartReview.Application.Interfaces;

namespace SmartReview.Infrastructure.AST;

public class RoslynAstPruningService : IAstPruningService
{
    public PruningResult PruneCode(string codeContent, string filePath)
    {
        if (string.IsNullOrWhiteSpace(codeContent))
        {
            return new PruningResult("", 0, 0, 0);
        }

        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        int originalTokens = EstimateTokenCount(codeContent);

        if (ext != ".cs")
        {
            var simplePruned = StripNonCsNoise(codeContent);
            int simplePrunedTokens = EstimateTokenCount(simplePruned);
            double savingsPct = originalTokens > 0 
                ? Math.Round((1.0 - (double)simplePrunedTokens / originalTokens) * 100, 2) 
                : 0;

            return new PruningResult(simplePruned, originalTokens, simplePrunedTokens, Math.Max(0, savingsPct));
        }

        try
        {
            var syntaxTree = CSharpSyntaxTree.ParseText(codeContent);
            var root = syntaxTree.GetRoot();

            // Roslyn Rewriter to remove trivia/comments
            var rewriter = new CommentAndNoiseRewriter();
            var prunedRoot = rewriter.Visit(root);

            // Extract structured AST context
            var classDecl = prunedRoot.DescendantNodes().OfType<ClassDeclarationSyntax>().FirstOrDefault();
            var className = classDecl?.Identifier.Text ?? Path.GetFileNameWithoutExtension(filePath);

            var ctor = classDecl?.DescendantNodes().OfType<ConstructorDeclarationSyntax>().FirstOrDefault();
            var injectedDependencies = ctor?.ParameterList.Parameters
                .Select(p => p.Type?.ToString() ?? "object")
                .ToList() ?? new List<string>();

            var methodDecl = classDecl?.DescendantNodes().OfType<MethodDeclarationSyntax>().FirstOrDefault();
            var methodSig = methodDecl != null 
                ? $"{methodDecl.ReturnType} {methodDecl.Identifier}{methodDecl.ParameterList}"
                : "void Execute()";
            var methodBody = methodDecl?.Body?.ToFullString() ?? methodDecl?.ExpressionBody?.ToFullString() ?? prunedRoot.ToFullString();

            var structuredContext = new
            {
                file_path = filePath,
                class_name = className,
                injected_dependencies = injectedDependencies,
                target_method = new
                {
                    signature = methodSig,
                    body = string.Join("\n", methodBody.Split('\n').Select(l => l.TrimEnd()).Where(l => !string.IsNullOrWhiteSpace(l)))
                }
            };

            string prunedJsonContent = JsonSerializer.Serialize(structuredContext, new JsonSerializerOptions { WriteIndented = true });

            int prunedTokens = EstimateTokenCount(prunedJsonContent);
            double savingsPct = originalTokens > 0 
                ? Math.Round((1.0 - (double)prunedTokens / originalTokens) * 100, 2) 
                : 0;

            return new PruningResult(prunedJsonContent, originalTokens, prunedTokens, Math.Max(0, savingsPct));
        }
        catch
        {
            int prunedTokens = EstimateTokenCount(codeContent);
            return new PruningResult(codeContent, originalTokens, prunedTokens, 0);
        }
    }

    private static int EstimateTokenCount(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return 0;
        return text.Length / 4 + text.Split(new[] { ' ', '\n', '\t', '.', ';', '(', ')' }, StringSplitOptions.RemoveEmptyEntries).Length / 2;
    }

    private static string StripNonCsNoise(string text)
    {
        var lines = text.Split('\n')
            .Select(l => l.TrimEnd())
            .Where(l => !string.IsNullOrWhiteSpace(l) && !l.TrimStart().StartsWith("--") && !l.TrimStart().StartsWith("//"));
        return string.Join("\n", lines);
    }
}

internal class CommentAndNoiseRewriter : CSharpSyntaxRewriter
{
    public override SyntaxTrivia VisitTrivia(SyntaxTrivia trivia)
    {
        if (trivia.IsKind(SyntaxKind.SingleLineCommentTrivia) ||
            trivia.IsKind(SyntaxKind.MultiLineCommentTrivia) ||
            trivia.IsKind(SyntaxKind.SingleLineDocumentationCommentTrivia) ||
            trivia.IsKind(SyntaxKind.MultiLineDocumentationCommentTrivia))
        {
            return default;
        }

        return base.VisitTrivia(trivia);
    }
}
