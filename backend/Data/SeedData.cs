using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public static class SeedData
{
    public static void Initialize(WorkItemDbContext dbContext)
    {
        SeedTags(dbContext);

        if (!dbContext.WorkItems.Any())
        {
            SeedWorkItems(dbContext);
        }

        SeedWorkItemTags(dbContext);
    }

    private static void SeedTags(WorkItemDbContext dbContext)
    {
        if (dbContext.Tags.Any())
        {
            return;
        }

        dbContext.Tags.AddRange(
            new Tag { Name = "onboarding", Color = "blue" },
            new Tag { Name = "setup", Color = "purple" },
            new Tag { Name = "security", Color = "red" },
            new Tag { Name = "reporting", Color = "green" });

        dbContext.SaveChanges();
    }

    private static void SeedWorkItems(WorkItemDbContext dbContext)
    {
        var now = DateTime.UtcNow;

        dbContext.WorkItems.AddRange(
            new WorkItem
            {
                Title = "Read onboarding document",
                Description = "Review the team onboarding guide before starting assigned tasks.",
                CreatedAt = now,
                UpdatedAt = now
            },
            new WorkItem
            {
                Title = "Setup development environment",
                Description = "Install required tools and verify the local project can run.",
                CreatedAt = now,
                UpdatedAt = now
            },
            new WorkItem
            {
                Title = "Review team coding guideline",
                Description = "Read the coding standards used by the engineering team.",
                CreatedAt = now,
                UpdatedAt = now
            },
            new WorkItem
            {
                Title = "Complete security training",
                Description = "Finish the required security awareness training module.",
                CreatedAt = now,
                UpdatedAt = now
            },
            new WorkItem
            {
                Title = "Submit weekly report",
                Description = "Prepare and submit the weekly progress report.",
                CreatedAt = now,
                UpdatedAt = now
            });

        dbContext.SaveChanges();
    }

    private static void SeedWorkItemTags(WorkItemDbContext dbContext)
    {
        if (dbContext.WorkItemTags.Any())
        {
            return;
        }

        var tagsByName = dbContext.Tags
            .AsNoTracking()
            .ToDictionary(tag => tag.Name, tag => tag.Id);
        var workItems = dbContext.WorkItems
            .AsNoTracking()
            .ToList();

        foreach (var workItem in workItems)
        {
            foreach (var tagId in GetTagIdsForWorkItem(workItem.Title, tagsByName))
            {
                dbContext.WorkItemTags.Add(new WorkItemTag
                {
                    WorkItemId = workItem.Id,
                    TagId = tagId
                });
            }
        }

        dbContext.SaveChanges();
    }

    private static IEnumerable<int> GetTagIdsForWorkItem(
        string title,
        IReadOnlyDictionary<string, int> tagsByName)
    {
        var normalizedTitle = title.ToLowerInvariant();

        if (normalizedTitle.Contains("onboarding") && tagsByName.TryGetValue("onboarding", out var onboardingTagId))
        {
            yield return onboardingTagId;
        }

        if (normalizedTitle.Contains("setup") && tagsByName.TryGetValue("setup", out var setupTagId))
        {
            yield return setupTagId;
        }

        if (normalizedTitle.Contains("security") && tagsByName.TryGetValue("security", out var securityTagId))
        {
            yield return securityTagId;
        }

        if (normalizedTitle.Contains("report") && tagsByName.TryGetValue("reporting", out var reportingTagId))
        {
            yield return reportingTagId;
        }
    }
}
