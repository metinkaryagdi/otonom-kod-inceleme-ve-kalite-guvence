namespace SmartReview.Core.Enums;

public enum ReviewStatus
{
    Received = 0,
    Pruning = 1,
    AgentsExecuting = 2,
    GuardrailFiltering = 3,
    SupervisorSynthesizing = 4,
    Completed = 5,
    Failed = 6
}
