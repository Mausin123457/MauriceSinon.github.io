using Microsoft.EntityFrameworkCore;
using MauriceSinon.Api.Data;
using MauriceSinon.Api.Dtos;
using MauriceSinon.Api.Models;

namespace MauriceSinon.Api.Services;

public class BlogPostService(PortfolioDbContext database) : IBlogPostService
{
    public async Task<IReadOnlyList<BlogPostDto>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        return await database.BlogPosts
            .AsNoTracking()
            .OrderByDescending(post => post.PublicationDate)
            .Select(post => new BlogPostDto(
                post.Id,
                post.Title,
                post.Content,
                post.PublicationDate))
            .ToListAsync(cancellationToken);
    }

    public async Task<BlogPostDto?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        var post = await database.BlogPosts
            .AsNoTracking()
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        return post is null ? null : ToDto(post);
    }

    public async Task<BlogPostDto> CreateAsync(
        BlogPostInputDto input,
        CancellationToken cancellationToken)
    {
        var post = new BlogPost
        {
            Title = input.Title,
            Content = input.Content,
            PublicationDate = input.PublicationDate!.Value
        };
        database.BlogPosts.Add(post);
        await database.SaveChangesAsync(cancellationToken);
        return ToDto(post);
    }

    public async Task<bool> UpdateAsync(
        int id,
        BlogPostInputDto input,
        CancellationToken cancellationToken)
    {
        var post = await database.BlogPosts
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (post is null) return false;

        post.Title = input.Title;
        post.Content = input.Content;
        post.PublicationDate = input.PublicationDate!.Value;
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        var post = await database.BlogPosts
            .SingleOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (post is null) return false;

        database.BlogPosts.Remove(post);
        await database.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static BlogPostDto ToDto(BlogPost post) =>
        new(post.Id, post.Title, post.Content, post.PublicationDate);
}
