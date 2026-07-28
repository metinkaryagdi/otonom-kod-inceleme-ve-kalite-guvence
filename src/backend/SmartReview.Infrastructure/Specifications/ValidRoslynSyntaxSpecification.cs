using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using SmartReview.Core.Entities;
using SmartReview.Core.Enums;
using SmartReview.Core.Specifications;

namespace SmartReview.Infrastructure.Specifications;

public class ValidRoslynSyntaxSpecification : ISpecification<AgentComment>
{
    public SpecificationResult IsSatisfiedBy(AgentComment comment)
    {
        // Only validate C# code snippets or suggested fixes from UnitTest agent
        if (comment.Agent != AgentType.UnitTest || string.IsNullOrWhiteSpace(comment.SuggestedFix))
        {
            return SpecificationResult.Success();
        }

        try
        {
            // Wrap in dummy class if snippet is method body
            string codeToCompile = comment.SuggestedFix;
            if (!codeToCompile.Contains("class ") && !codeToCompile.Contains("namespace "))
            {
                codeToCompile = $@"
using System;
using System.Threading.Tasks;
using Xunit;
using Moq;

public class TestContainer
{{
    {codeToCompile}
}}";
            }

            var syntaxTree = CSharpSyntaxTree.ParseText(codeToCompile);
            var diagnostics = syntaxTree.GetDiagnostics().Where(d => d.Severity == DiagnosticSeverity.Error).ToList();

            if (diagnostics.Any())
            {
                var errors = string.Join("; ", diagnostics.Select(d => d.GetMessage()));
                return SpecificationResult.Failure($"Üretilen test kodu C# Roslyn sözdizim derleme hatası verdi: {errors}");
            }

            return SpecificationResult.Success();
        }
        catch (Exception ex)
        {
            return SpecificationResult.Failure($"Roslyn sözdizimi doğrulanırken hata oluştu: {ex.Message}");
        }
    }
}
