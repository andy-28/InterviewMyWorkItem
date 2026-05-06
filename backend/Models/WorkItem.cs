namespace backend.Models;

public class WorkItem
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public ICollection<UserWorkItemStatus> UserStatuses { get; set; } = [];
}
