using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class WorkItemDbContext(DbContextOptions<WorkItemDbContext> options) : DbContext(options)
{
    public DbSet<WorkItem> WorkItems => Set<WorkItem>();

    public DbSet<UserWorkItemStatus> UserWorkItemStatuses => Set<UserWorkItemStatus>();

    public DbSet<Tag> Tags => Set<Tag>();

    public DbSet<WorkItemTag> WorkItemTags => Set<WorkItemTag>();

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

        modelBuilder.Entity<Tag>(entity =>
        {
            entity.ToTable("Tags");

            entity.Property(tag => tag.Name)
                .HasMaxLength(60)
                .IsRequired();

            entity.Property(tag => tag.Color)
                .HasMaxLength(30)
                .IsRequired();

            entity.HasIndex(tag => tag.Name)
                .IsUnique();
        });

        modelBuilder.Entity<WorkItemTag>(entity =>
        {
            entity.ToTable("WorkItemTags");

            entity.HasKey(workItemTag => new { workItemTag.WorkItemId, workItemTag.TagId });

            entity.HasOne(workItemTag => workItemTag.WorkItem)
                .WithMany(workItem => workItem.WorkItemTags)
                .HasForeignKey(workItemTag => workItemTag.WorkItemId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(workItemTag => workItemTag.Tag)
                .WithMany(tag => tag.WorkItemTags)
                .HasForeignKey(workItemTag => workItemTag.TagId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
