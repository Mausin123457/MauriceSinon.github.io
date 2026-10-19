using System.ComponentModel.DataAnnotations;

namespace MauriceSinon.Api.Dtos;

public record BlogPostDto(int Id, string Title, string Content, DateTime PublicationDate);

public class BlogPostInputDto
{
    [Required, StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required, StringLength(10000)]
    public string Content { get; set; } = string.Empty;

    [Required]
    public DateTime? PublicationDate { get; set; }
}
