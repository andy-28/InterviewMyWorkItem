using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class WorkItemDbContext(DbContextOptions<WorkItemDbContext> options) : DbContext(options)
{
    public DbSet<WorkItem> WorkItems => Set<WorkItem>();

    public DbSet<UserWorkItemStatus> UserWorkItemStatuses => Set<UserWorkItemStatus>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WorkItem>(entity =>
        {
            entity.ToTable("WorkItems");

            entity.Property(workItem => workItem.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(workItem => workItem.Description)
                .HasMaxLength(2000);

            entity.Property(workItem => workItem.CreatedAt)
                .IsRequired();

            entity.Property(workItem => workItem.UpdatedAt)
                .IsRequired();
        });

        modelBuilder.Entity<UserWorkItemStatus>(entity =>
        {
            entity.ToTable("UserWorkItemStatuses");

            entity.Property(status => status.UserId)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(status => status.IsConfirmed)
                .IsRequired();

            entity.HasIndex(status => new { status.UserId, status.WorkItemId })
                .IsUnique();

            entity.HasOne(status => status.WorkItem)
                .WithMany(workItem => workItem.UserStatuses)
                .HasForeignKey(status => status.WorkItemId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
