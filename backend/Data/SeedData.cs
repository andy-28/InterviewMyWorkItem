using backend.Models;

namespace backend.Data;

public static class SeedData
{
    public static void Initialize(WorkItemDbContext dbContext)
    {
        if (dbContext.WorkItems.Any())
        {
            return;
        }

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
}
