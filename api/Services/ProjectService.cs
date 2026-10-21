using Microsoft.EntityFrameworkCore;
using MauriceSinon.Api.Data;
using MauriceSinon.Api.Dtos;
using MauriceSinon.Api.Models;

namespace MauriceSinon.Api.Services;

public class ProjectService(PortfolioDbContext database) : IProjectService
{
    public async Task<IReadOnlyList<ProjectDto>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        return await database.Projects
            .AsNoTracking()
            .OrderByDescending(project => project.Date)
            .Select(project => new ProjectDto(
                project.Id,
                project.Title,
                project.Description,
                project.Category,
                project.GitHubUrl,
                project.Date))
            .ToListAsync(cancellationToken);
    }

    public async Task<ProjectDto?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var project = await database.Projects
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        return project is null ? null : ToDto(project);
    }

    public async Task<ProjectDto> CreateAsync(
        ProjectInputDto input,
        CancellationToken cancellationToken)
    {
        var project = new Project
        {
            Title = input.Title,
            Description = input.Description,
            Category = input.Category,
            GitHubUrl = input.GitHubUrl,
            Date = input.Date!.Value
        };
        database.Projects.Add(project);
        await database.SaveChangesAsync(cancellationToken);
        return ToDto(project);
    }

    public async Task<bool> UpdateAsync(
        int id,
        ProjectInputDto input,
        CancellationToken cancellationToken)
    {
        var project = await database.Projects
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (project is null) return false;

        project.Title = input.Title;
        project.Description = input.Description;
        project.Category = input.Category;
        project.GitHubUrl = input.GitHubUrl;
        project.Date = input.Date!.Value;
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var project = await database.Projects
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (project is null) return false;

        database.Projects.Remove(project);
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static ProjectDto ToDto(Project project) =>
        new(project.Id, project.Title, project.Description, project.Category,
            project.GitHubUrl, project.Date);
}
