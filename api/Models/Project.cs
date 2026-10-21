namespace MauriceSinon.Api.Models;

public class Project
{
    public int Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required string Category { get; set; }
    public string? GitHubUrl { get; set; }
    public DateTime Date { get; set; }
}
