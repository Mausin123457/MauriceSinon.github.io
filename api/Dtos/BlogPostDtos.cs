using System.ComponentModel.DataAnnotations;

namespace MauriceSinon.Api.Dtos;

public sealed record BlogPostDto(
    int Id, 
    string Title, 
    string Content, 
    DateTime PublicationDate);

public sealed record BlogPostInputDto
{
    [Required, StringLength(200, MinimumLength = 1)]
    public required string Title { get; init; }

    [Required, StringLength(10000, MinimumLength = 1)]
    public required string Content { get; init; }

    [Required]
    public DateTime? PublicationDate { get; init; }
}
