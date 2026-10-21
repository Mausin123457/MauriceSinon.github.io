using MauriceSinon.Api.Dtos;

namespace MauriceSinon.Api.Services;

public interface IBlogPostService
{
    Task<IReadOnlyList<BlogPostDto>> GetAllAsync(CancellationToken cancellationToken);
    Task<BlogPostDto?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<BlogPostDto> CreateAsync(BlogPostInputDto input, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(int id, BlogPostInputDto input, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}
