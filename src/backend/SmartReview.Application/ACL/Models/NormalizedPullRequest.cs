namespace SmartReview.Application.ACL.Models;

public class NormalizedPullRequest
{
    public string RepositoryName { get; set; } = string.Empty;
    public int PullRequestId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string SourceBranch { get; set; } = string.Empty;
    public string TargetBranch { get; set; } = string.Empty;
    public List<NormalizedCodeFile> Files { get; set; } = new();
}

public class NormalizedCodeFile
{
    public string FilePath { get; set; } = string.Empty;
    public string Extension { get; set; } = string.Empty;
    public string Status { get; set; } = "modified"; // added, modified, deleted
    public string PatchOrDiff { get; set; } = string.Empty;
    public string FullContent { get; set; } = string.Empty;
}
