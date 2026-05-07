using backend.DTOs;

namespace backend.Services;

public interface IWorkItemService
{
    Task<List<WorkItemListDto>> GetAdminWorkItemsAsync();

    Task<List<TagDto>> GetTagsAsync();

    Task<List<WorkItemListDto>> GetWorkItemsForUserAsync(string userId, string? sort);

    Task<WorkItemDetailDto?> GetWorkItemDetailForUserAsync(int id, string userId);

    Task<int> ConfirmWorkItemsAsync(string userId, IEnumerable<int> workItemIds);

    Task<bool> UnconfirmWorkItemAsync(string userId, int workItemId);

    Task<WorkItemDetailDto> CreateWorkItemAsync(CreateWorkItemRequest request);

    Task<WorkItemDetailDto?> UpdateWorkItemAsync(int id, UpdateWorkItemRequest request);

    Task<bool> DeleteWorkItemAsync(int id);
}
