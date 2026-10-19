using Microsoft.EntityFrameworkCore;
using MauriceSinon.Api.Models;

namespace MauriceSinon.Api.Data;

public class PortfolioDbContext(DbContextOptions<PortfolioDbContext> options)
    : DbContext(options)
{
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<BlogPost> BlogPosts => Set<BlogPost>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>(entity =>
        {
            entity.Property(project => project.Title).HasMaxLength(200).IsRequired();
            entity.Property(project => project.Description).HasMaxLength(2000).IsRequired();
            entity.Property(project => project.Category).HasMaxLength(100).IsRequired();
            entity.Property(project => project.GitHubUrl).HasMaxLength(500);
        });

        modelBuilder.Entity<BlogPost>(entity =>
        {
            entity.Property(post => post.Title).HasMaxLength(200).IsRequired();
            entity.Property(post => post.Content).HasMaxLength(10000).IsRequired();
        });
    }
}
