namespace backend.DTOs;

public class UpdateWorkItemRequest
{
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public List<int> TagIds { get; set; } = [];
}
