using MauriceSinon.Api.Dtos;

namespace MauriceSinon.Api.Services;

public interface IProjectService
{
    Task<IReadOnlyList<ProjectDto>> GetAllAsync(CancellationToken cancellationToken);
    Task<ProjectDto?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<ProjectDto> CreateAsync(ProjectInputDto input, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(int id, ProjectInputDto input, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}
