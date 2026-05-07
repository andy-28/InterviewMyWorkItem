using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
public class WorkItemsController(IWorkItemService workItemService) : ControllerBase
{
    [HttpGet("api/work-items")]
    [ProducesResponseType(typeof(List<WorkItemListDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<WorkItemListDto>>> GetWorkItems(
        [FromQuery] string? userId,
        [FromQuery] string? sort = "desc")
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return BadRequest(new ApiMessageResponse { Message = "userId is required." });
        }

        var workItems = await workItemService.GetWorkItemsForUserAsync(userId.Trim(), sort);

        return Ok(workItems);
    }

    [HttpGet("api/work-items/{id:int}")]
    [ProducesResponseType(typeof(WorkItemDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkItemDetailDto>> GetWorkItemDetail(
        [FromRoute] int id,
        [FromQuery] string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return BadRequest(new ApiMessageResponse { Message = "userId is required." });
        }

        var workItem = await workItemService.GetWorkItemDetailForUserAsync(id, userId.Trim());

        if (workItem is null)
        {
            return NotFound(new ApiMessageResponse { Message = "Work item was not found." });
        }

        return Ok(workItem);
    }

    [HttpPost("api/work-items/confirm")]
    [ProducesResponseType(typeof(ConfirmWorkItemsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ConfirmWorkItemsResponse>> ConfirmWorkItems(
        [FromQuery] string? userId,
        [FromBody] ConfirmWorkItemsRequest request)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return BadRequest(new ApiMessageResponse { Message = "userId is required." });
        }

        if (request.WorkItemIds.Count == 0)
        {
            return BadRequest(new ApiMessageResponse { Message = "At least one work item id is required." });
        }

        var confirmedCount = await workItemService.ConfirmWorkItemsAsync(userId.Trim(), request.WorkItemIds);

        return Ok(new ConfirmWorkItemsResponse
        {
            ConfirmedCount = confirmedCount,
            Message = $"{confirmedCount} work item(s) confirmed."
        });
    }

    [HttpPost("api/work-items/{id:int}/unconfirm")]
    [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiMessageResponse>> UnconfirmWorkItem(
        [FromRoute] int id,
        [FromQuery] string? userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return BadRequest(new ApiMessageResponse { Message = "userId is required." });
        }

        var isUpdated = await workItemService.UnconfirmWorkItemAsync(userId.Trim(), id);

        if (!isUpdated)
        {
            return NotFound(new ApiMessageResponse { Message = "Work item status was not found." });
        }

        return Ok(new ApiMessageResponse { Message = "Work item unconfirmed." });
    }

    [HttpGet("api/admin/work-items")]
    [ProducesResponseType(typeof(List<WorkItemListDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<WorkItemListDto>>> GetAdminWorkItems()
    {
        var workItems = await workItemService.GetAdminWorkItemsAsync();

        return Ok(workItems);
    }

    [HttpGet("api/admin/tags")]
    [ProducesResponseType(typeof(List<TagDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<TagDto>>> GetTags()
    {
        var tags = await workItemService.GetTagsAsync();

        return Ok(tags);
    }

    [HttpPost("api/admin/work-items")]
    [ProducesResponseType(typeof(WorkItemDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<WorkItemDetailDto>> CreateWorkItem([FromBody] CreateWorkItemRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new ApiMessageResponse { Message = "Title is required." });
        }

        var createdWorkItem = await workItemService.CreateWorkItemAsync(request);

        return CreatedAtAction(
            nameof(GetWorkItemDetail),
            new { id = createdWorkItem.Id, userId = "admin" },
            createdWorkItem);
    }

    [HttpPut("api/admin/work-items/{id:int}")]
    [ProducesResponseType(typeof(WorkItemDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkItemDetailDto>> UpdateWorkItem(
        [FromRoute] int id,
        [FromBody] UpdateWorkItemRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new ApiMessageResponse { Message = "Title is required." });
        }

        var updatedWorkItem = await workItemService.UpdateWorkItemAsync(id, request);

        if (updatedWorkItem is null)
        {
            return NotFound(new ApiMessageResponse { Message = "Work item was not found." });
        }

        return Ok(updatedWorkItem);
    }

    [HttpDelete("api/admin/work-items/{id:int}")]
    [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiMessageResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiMessageResponse>> DeleteWorkItem([FromRoute] int id)
    {
        var isDeleted = await workItemService.DeleteWorkItemAsync(id);

        if (!isDeleted)
        {
            return NotFound(new ApiMessageResponse { Message = "Work item was not found." });
        }

        return Ok(new ApiMessageResponse { Message = "Work item deleted." });
    }
}
