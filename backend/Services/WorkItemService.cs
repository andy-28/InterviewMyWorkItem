using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class WorkItemService(WorkItemDbContext dbContext) : IWorkItemService
{
    public async Task<List<WorkItemListDto>> GetAdminWorkItemsAsync()
    {
        return await dbContext.WorkItems
            .AsNoTracking()
            .OrderByDescending(workItem => workItem.UpdatedAt)
            .Select(workItem => new WorkItemListDto
            {
                Id = workItem.Id,
                Title = workItem.Title,
                IsConfirmed = false,
                CreatedAt = workItem.CreatedAt,
                UpdatedAt = workItem.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<List<WorkItemListDto>> GetWorkItemsForUserAsync(string userId, string? sort)
    {
        var query = dbContext.WorkItems
            .AsNoTracking()
            .Select(workItem => new WorkItemListDto
            {
                Id = workItem.Id,
                Title = workItem.Title,
                IsConfirmed = workItem.UserStatuses
                    .Where(status => status.UserId == userId)
                    .Select(status => status.IsConfirmed)
                    .FirstOrDefault(),
                CreatedAt = workItem.CreatedAt,
                UpdatedAt = workItem.UpdatedAt
            });

        query = NormalizeSort(sort) switch
        {
            "asc" => query.OrderBy(workItem => workItem.UpdatedAt),
            "desc" => query.OrderByDescending(workItem => workItem.UpdatedAt),
            "title" => query.OrderBy(workItem => workItem.Title),
            "title_desc" => query.OrderByDescending(workItem => workItem.Title),
            "created" => query.OrderBy(workItem => workItem.CreatedAt),
            "created_desc" => query.OrderByDescending(workItem => workItem.CreatedAt),
            "updated" => query.OrderBy(workItem => workItem.UpdatedAt),
            _ => query.OrderByDescending(workItem => workItem.UpdatedAt)
        };

        return await query.ToListAsync();
    }

    public async Task<WorkItemDetailDto?> GetWorkItemDetailForUserAsync(int id, string userId)
    {
        return await dbContext.WorkItems
            .AsNoTracking()
            .Where(workItem => workItem.Id == id)
            .Select(workItem => new WorkItemDetailDto
            {
                Id = workItem.Id,
                Title = workItem.Title,
                Description = workItem.Description,
                IsConfirmed = workItem.UserStatuses
                    .Where(status => status.UserId == userId)
                    .Select(status => status.IsConfirmed)
                    .FirstOrDefault(),
                CreatedAt = workItem.CreatedAt,
                UpdatedAt = workItem.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<int> ConfirmWorkItemsAsync(string userId, IEnumerable<int> workItemIds)
    {
        var distinctIds = workItemIds.Distinct().ToList();

        if (distinctIds.Count == 0)
        {
            return 0;
        }

        var existingWorkItemIds = await dbContext.WorkItems
            .Where(workItem => distinctIds.Contains(workItem.Id))
            .Select(workItem => workItem.Id)
            .ToListAsync();

        if (existingWorkItemIds.Count == 0)
        {
            return 0;
        }

        var statuses = await dbContext.UserWorkItemStatuses
            .Where(status => status.UserId == userId && existingWorkItemIds.Contains(status.WorkItemId))
            .ToListAsync();

        var statusesByWorkItemId = statuses.ToDictionary(status => status.WorkItemId);
        var now = DateTime.UtcNow;

        foreach (var workItemId in existingWorkItemIds)
        {
            if (statusesByWorkItemId.TryGetValue(workItemId, out var status))
            {
                status.IsConfirmed = true;
                status.ConfirmedAt = now;
                continue;
            }

            dbContext.UserWorkItemStatuses.Add(new UserWorkItemStatus
            {
                UserId = userId,
                WorkItemId = workItemId,
                IsConfirmed = true,
                ConfirmedAt = now
            });
        }

        await dbContext.SaveChangesAsync();

        return existingWorkItemIds.Count;
    }

    public async Task<bool> UnconfirmWorkItemAsync(string userId, int workItemId)
    {
        var status = await dbContext.UserWorkItemStatuses
            .FirstOrDefaultAsync(status => status.UserId == userId && status.WorkItemId == workItemId);

        if (status is null)
        {
            return false;
        }

        status.IsConfirmed = false;
        status.ConfirmedAt = null;

        await dbContext.SaveChangesAsync();

        return true;
    }

    public async Task<WorkItemDetailDto> CreateWorkItemAsync(CreateWorkItemRequest request)
    {
        var now = DateTime.UtcNow;
        var workItem = new WorkItem
        {
            Title = request.Title.Trim(),
            Description = NormalizeDescription(request.Description),
            CreatedAt = now,
            UpdatedAt = now
        };

        dbContext.WorkItems.Add(workItem);
        await dbContext.SaveChangesAsync();

        return MapToDetailDto(workItem, isConfirmed: false);
    }

    public async Task<WorkItemDetailDto?> UpdateWorkItemAsync(int id, UpdateWorkItemRequest request)
    {
        var workItem = await dbContext.WorkItems.FindAsync(id);

        if (workItem is null)
        {
            return null;
        }

        workItem.Title = request.Title.Trim();
        workItem.Description = NormalizeDescription(request.Description);
        workItem.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync();

        return MapToDetailDto(workItem, isConfirmed: false);
    }

    public async Task<bool> DeleteWorkItemAsync(int id)
    {
        var workItem = await dbContext.WorkItems.FindAsync(id);

        if (workItem is null)
        {
            return false;
        }

        dbContext.WorkItems.Remove(workItem);
        await dbContext.SaveChangesAsync();

        return true;
    }

    private static string NormalizeSort(string? sort)
    {
        return sort?.Trim().ToLowerInvariant() ?? string.Empty;
    }

    private static string? NormalizeDescription(string? description)
    {
        return string.IsNullOrWhiteSpace(description) ? null : description.Trim();
    }

    private static WorkItemDetailDto MapToDetailDto(WorkItem workItem, bool isConfirmed)
    {
        return new WorkItemDetailDto
        {
            Id = workItem.Id,
            Title = workItem.Title,
            Description = workItem.Description,
            IsConfirmed = isConfirmed,
            CreatedAt = workItem.CreatedAt,
            UpdatedAt = workItem.UpdatedAt
        };
    }
}
