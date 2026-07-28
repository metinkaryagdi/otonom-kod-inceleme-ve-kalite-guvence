namespace SmartReview.Core.Specifications;

public interface ISpecification<in T>
{
    SpecificationResult IsSatisfiedBy(T entity);
}
