namespace MauriceSinon.Api.Models;

public class BlogPost
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Content { get; set; }
    public DateTime PublicationDate { get; set; }
}
