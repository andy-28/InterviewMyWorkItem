namespace backend.Models;

public class UserWorkItemStatus
{
    public int Id { get; set; }

    public string UserId { get; set; } = string.Empty;

    public int WorkItemId { get; set; }

    public bool IsConfirmed { get; set; }

    public DateTime? ConfirmedAt { get; set; }

    public WorkItem WorkItem { get; set; } = null!;
}
