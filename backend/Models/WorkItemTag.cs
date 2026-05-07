namespace backend.Models;

public class WorkItemTag
{
    public int WorkItemId { get; set; }

    public int TagId { get; set; }

    public WorkItem WorkItem { get; set; } = null!;

    public Tag Tag { get; set; } = null!;
}
