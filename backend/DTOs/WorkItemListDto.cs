namespace backend.DTOs;

public class WorkItemListDto
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public bool IsConfirmed { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public List<TagDto> Tags { get; set; } = [];
}
