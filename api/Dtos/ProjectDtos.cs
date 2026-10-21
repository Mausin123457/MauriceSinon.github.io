using System.ComponentModel.DataAnnotations;

namespace MauriceSinon.Api.Dtos;

public sealed record ProjectDto(
    int Id,
    string Title,
    string Description,
    string Category,
    string? GitHubUrl,
    DateTime Date);

public sealed record ProjectInputDto
{
    [Required, StringLength(200, MinimumLength = 1)]
    public required string Title { get; init; }

    [Required, StringLength(2000, MinimumLength = 1)]
    public required string Description { get; init; }

    [Required, StringLength(100, MinimumLength = 1)]
    public required string Category { get; init; }

    [Url, StringLength(500)]
    public string? GitHubUrl { get; init; }

    [Required]
    public DateTime? Date { get; init; }
}
