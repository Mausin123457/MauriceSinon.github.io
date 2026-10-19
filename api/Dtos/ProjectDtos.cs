using System.ComponentModel.DataAnnotations;

namespace MauriceSinon.Api.Dtos;

public record ProjectDto(
    int Id,
    string Title,
    string Description,
    string Category,
    string? GitHubUrl,
    DateTime Date);

public class ProjectInputDto
{
    [Required, StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required, StringLength(2000)]
    public string Description { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string Category { get; set; } = string.Empty;

    [Url, StringLength(500)]
    public string? GitHubUrl { get; set; }

    [Required]
    public DateTime? Date { get; set; }
}
