using MauriceSinon.Api.Dtos;
using MauriceSinon.Api.Services;

namespace MauriceSinon.Api.Endpoints;

public static class BlogPostEndpoints
{
    public static IEndpointRouteBuilder MapBlogPostEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/blogposts")
            .WithTags("Blogposts");

        group.MapGet("/", async (
            IBlogPostService blogPosts,
            CancellationToken cancellationToken) =>
            Results.Ok(await blogPosts.GetAllAsync(cancellationToken)))
            .WithName("GetBlogPosts");

        group.MapGet("/{id:int}", async (
            int id,
            IBlogPostService blogPosts,
            CancellationToken cancellationToken) =>
        {
            var post = await blogPosts.GetByIdAsync(id, cancellationToken);
            return post is null ? Results.NotFound() : Results.Ok(post);
        })
        .WithName("GetBlogPost");

        group.MapPost("/", async (
            BlogPostInputDto input,
            IBlogPostService blogPosts,
            CancellationToken cancellationToken) =>
        {
            var post = await blogPosts.CreateAsync(input, cancellationToken);
            return Results.Created($"/api/blogposts/{post.Id}", post);
        });

        group.MapPut("/{id:int}", async (
            int id,
            BlogPostInputDto input,
            IBlogPostService blogPosts,
            CancellationToken cancellationToken) =>
            await blogPosts.UpdateAsync(id, input, cancellationToken)
                ? Results.NoContent()
                : Results.NotFound());

        group.MapDelete("/{id:int}", async (
            int id,
            IBlogPostService blogPosts,
            CancellationToken cancellationToken) =>
            await blogPosts.DeleteAsync(id, cancellationToken)
                ? Results.NoContent()
                : Results.NotFound());

        return endpoints;
    }
}
