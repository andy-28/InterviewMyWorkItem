namespace backend.Models;

public class Tag
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Color { get; set; } = "blue";

    public ICollection<WorkItemTag> WorkItemTags { get; set; } = [];
}
