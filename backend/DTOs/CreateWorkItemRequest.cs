namespace backend.DTOs;

public class CreateWorkItemRequest
{
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }
}
