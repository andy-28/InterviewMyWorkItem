namespace backend.DTOs;

public class ConfirmWorkItemsResponse
{
    public int ConfirmedCount { get; set; }

    public string Message { get; set; } = string.Empty;
}
