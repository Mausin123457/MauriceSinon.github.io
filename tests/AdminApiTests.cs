using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using MauriceSinon.Api.Identity;
using Xunit;

namespace MauriceSinon.Api.Tests;

public sealed class AdminApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Write_without_authentication_returns_unauthorized()
    {
        using var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/projects", ValidProject());

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_with_invalid_password_returns_unauthorized()
    {
        using var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/admin/login", new
        {
            username = ApiFactory.Username,
            password = "wrong-password"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Admin_can_create_and_read_project_after_login()
    {
        using var client = CreateAuthenticatedClient();
        var createResponse = await client.PostAsJsonAsync("/api/projects", ValidProject());

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var project = await createResponse.Content.ReadFromJsonAsync<ProjectResponse>();
        Assert.NotNull(project);

        var readResponse = await client.GetAsync($"/api/projects/{project!.Id}");
        Assert.Equal(HttpStatusCode.OK, readResponse.StatusCode);
        var saved = await readResponse.Content.ReadFromJsonAsync<ProjectResponse>();
        Assert.Equal("Test project", saved!.Title);
    }

    [Fact]
    public async Task Public_project_get_routes_return_expected_results()
    {
        using var client = factory.CreateClient();

        var all = await client.GetAsync("/api/projects/");
        var missing = await client.GetAsync("/api/projects/999999");

        Assert.Equal(HttpStatusCode.OK, all.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    [Fact]
    public async Task Public_blog_post_get_routes_return_expected_results()
    {
        using var client = CreateAuthenticatedClient();
        var create = await client.PostAsJsonAsync("/api/blogposts", ValidBlogPost());
        var post = await create.Content.ReadFromJsonAsync<BlogPostResponse>();

        using var publicClient = factory.CreateClient();
        var all = await publicClient.GetAsync("/api/blogposts/");
        var single = await publicClient.GetAsync($"/api/blogposts/{post!.Id}");

        Assert.Equal(HttpStatusCode.OK, all.StatusCode);
        Assert.Equal(HttpStatusCode.OK, single.StatusCode);
    }

    [Fact]
    public async Task Guest_cannot_write_projects()
    {
        using var client = await CreateIdentityClient(IdentityRoles.Guest);

        var response = await client.PostAsJsonAsync("/api/projects", ValidProject());

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Editor_can_create_a_project()
    {
        using var client = await CreateIdentityClient(IdentityRoles.Editor);

        var response = await client.PostAsJsonAsync("/api/projects", ValidProject());

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Identity_admin_can_create_a_blog_post()
    {
        using var client = await CreateIdentityClient(IdentityRoles.Admin);

        var response = await client.PostAsJsonAsync("/api/blogposts", ValidBlogPost());
        var post = await response.Content.ReadFromJsonAsync<BlogPostResponse>();

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(post);
        Assert.Equal("Test post", post!.Title);
        Assert.Equal("A blog post created by an integration test.", post.Content);

        var saved = await client.GetAsync($"/api/blogposts/{post.Id}");
        Assert.Equal(HttpStatusCode.OK, saved.StatusCode);
        var savedPost = await saved.Content.ReadFromJsonAsync<BlogPostResponse>();
        Assert.Equal(post.Id, savedPost!.Id);
        Assert.Equal(post.Title, savedPost.Title);
        Assert.Equal(post.Content, savedPost.Content);
    }

    [Fact]
    public async Task Invalid_project_is_rejected_before_persistence()
    {
        using var client = CreateAuthenticatedClient();
        var response = await client.PostAsJsonAsync("/api/projects", new
        {
            title = "",
            description = "valid description",
            category = "Testing",
            date = "2026-10-19T11:00:00Z"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Authenticated_write_without_csrf_token_returns_forbidden()
    {
        using var client = factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/admin/login", new
        {
            username = ApiFactory.Username,
            password = ApiFactory.Password
        });
        login.EnsureSuccessStatusCode();
        var authCookie = login.Headers.GetValues("Set-Cookie")
            .Single(cookie => cookie.StartsWith("maurice-admin=", StringComparison.Ordinal))
            .Split(';', 2)[0];
        client.DefaultRequestHeaders.Add("Cookie", authCookie);

        var response = await client.PostAsJsonAsync("/api/projects", ValidProject());

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Authenticated_client_can_get_csrf_token()
    {
        using var client = CreateAuthenticatedClient();

        var response = await client.GetAsync("/api/admin/csrf");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("token", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Admin_can_complete_project_crud_cycle()
    {
        using var client = await CreateIdentityClient(IdentityRoles.Admin);
        var create = await client.PostAsJsonAsync("/api/projects", ValidProject());
        var project = await create.Content.ReadFromJsonAsync<ProjectResponse>();

        var update = await client.PutAsJsonAsync($"/api/projects/{project!.Id}", new
        {
            title = "Updated project",
            description = "Updated description",
            category = "Updated",
            date = "2026-10-20T11:00:00Z"
        });
        var updated = await client.GetAsync($"/api/projects/{project.Id}");
        var delete = await client.DeleteAsync($"/api/projects/{project.Id}");
        var missing = await client.GetAsync($"/api/projects/{project.Id}");

        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        var saved = await updated.Content.ReadFromJsonAsync<ProjectResponse>();
        Assert.Equal("Updated project", saved!.Title);
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    [Fact]
    public async Task Admin_can_complete_blog_post_crud_cycle()
    {
        using var client = await CreateIdentityClient(IdentityRoles.Admin);
        var create = await client.PostAsJsonAsync("/api/blogposts", ValidBlogPost());
        var post = await create.Content.ReadFromJsonAsync<BlogPostResponse>();

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        Assert.NotNull(post);
        Assert.Equal("Test post", post!.Title);
        Assert.Equal("A blog post created by an integration test.", post.Content);

        var update = await client.PutAsJsonAsync($"/api/blogposts/{post!.Id}", new
        {
            title = "Updated post",
            content = "Updated content",
            publicationDate = "2026-10-20T11:00:00Z"
        });
        var updated = await client.GetAsync($"/api/blogposts/{post.Id}");
        var delete = await client.DeleteAsync($"/api/blogposts/{post.Id}");
        var missing = await client.GetAsync($"/api/blogposts/{post.Id}");

        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        var saved = await updated.Content.ReadFromJsonAsync<BlogPostResponse>();
        Assert.Equal("Updated post", saved!.Title);
        Assert.Equal("Updated content", saved.Content);
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    [Fact]
    public async Task Identity_admin_can_complete_project_crud_cycle()
    {
        using var client = await CreateIdentityClient(IdentityRoles.Admin);
        var create = await client.PostAsJsonAsync("/api/projects", ValidProject());
        var project = await create.Content.ReadFromJsonAsync<ProjectResponse>();

        var update = await client.PutAsJsonAsync($"/api/projects/{project!.Id}", new
        {
            title = "Identity updated project",
            description = "Updated through Identity authentication.",
            category = "Identity",
            date = "2026-10-20T11:00:00Z"
        });
        var updated = await client.GetAsync($"/api/projects/{project.Id}");
        var delete = await client.DeleteAsync($"/api/projects/{project.Id}");
        var missing = await client.GetAsync($"/api/projects/{project.Id}");

        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        var saved = await updated.Content.ReadFromJsonAsync<ProjectResponse>();
        Assert.Equal("Identity updated project", saved!.Title);
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    [Fact]
    public async Task Updating_unknown_project_returns_not_found()
    {
        using var client = CreateAuthenticatedClient();

        var response = await client.PutAsJsonAsync("/api/projects/999999", new
        {
            title = "Unknown project",
            description = "This project does not exist.",
            category = "Testing",
            date = "2026-10-20T11:00:00Z"
        });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Deleting_unknown_project_returns_not_found()
    {
        using var client = CreateAuthenticatedClient();

        var response = await client.DeleteAsync("/api/projects/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Updating_unknown_blog_post_returns_not_found()
    {
        using var client = CreateAuthenticatedClient();

        var response = await client.PutAsJsonAsync("/api/blogposts/999999", new
        {
            title = "Unknown post",
            content = "This post does not exist.",
            publicationDate = "2026-10-20T11:00:00Z"
        });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Deleting_unknown_blog_post_returns_not_found()
    {
        using var client = CreateAuthenticatedClient();

        var response = await client.DeleteAsync("/api/blogposts/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Invalid_blog_post_is_rejected()
    {
        using var client = CreateAuthenticatedClient();
        var response = await client.PostAsJsonAsync("/api/blogposts", new
        {
            title = "",
            content = "valid content",
            publicationDate = "2026-10-19T11:00:00Z"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Swagger_is_not_available_outside_development()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/swagger/index.html");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private HttpClient CreateAuthenticatedClient()
    {
        var client = factory.CreateClient();
        var login = client.PostAsJsonAsync("/api/admin/login", new
        {
            username = ApiFactory.Username,
            password = ApiFactory.Password
        }).GetAwaiter().GetResult();
        login.EnsureSuccessStatusCode();

        var cookies = login.Headers.GetValues("Set-Cookie").ToArray();
        var authCookie = cookies.Single(cookie => cookie.StartsWith("maurice-admin=", StringComparison.Ordinal));
        var csrfCookie = cookies.Single(cookie => cookie.StartsWith("maurice-csrf=", StringComparison.Ordinal));
        var csrf = csrfCookie.Split(';', 2)[0].Split('=', 2)[1];
        client.DefaultRequestHeaders.Add("Cookie", $"{authCookie.Split(';', 2)[0]}; {csrfCookie.Split(';', 2)[0]}");
        client.DefaultRequestHeaders.Add("X-CSRF-TOKEN", csrf);
        return client;
    }

    private async Task<HttpClient> CreateIdentityClient(string role)
    {
        var username = $"{role.ToLowerInvariant()}-{Guid.NewGuid():N}";
        using (var scope = factory.Services.CreateScope())
        {
            var userManager = scope.ServiceProvider
                .GetRequiredService<UserManager<ApplicationUser>>();
            var user = new ApplicationUser { UserName = username };
            var createResult = await userManager.CreateAsync(
                user,
                "ValidPassword123!");
            Assert.True(createResult.Succeeded);
            var roleResult = await userManager.AddToRoleAsync(user, role);
            Assert.True(roleResult.Succeeded);
        }

        var client = factory.CreateClient();
        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            username,
            password = "ValidPassword123!"
        });
        login.EnsureSuccessStatusCode();

        var cookies = login.Headers.GetValues("Set-Cookie").ToArray();
        var authCookie = cookies.Single(cookie =>
            cookie.StartsWith("maurice-identity=", StringComparison.Ordinal));
        var csrfCookie = cookies.Single(cookie =>
            cookie.StartsWith("maurice-csrf=", StringComparison.Ordinal));
        var csrf = csrfCookie.Split(';', 2)[0].Split('=', 2)[1];
        client.DefaultRequestHeaders.Add(
            "Cookie",
            $"{authCookie.Split(';', 2)[0]}; {csrfCookie.Split(';', 2)[0]}");
        client.DefaultRequestHeaders.Add("X-CSRF-TOKEN", csrf);
        return client;
    }

    private static object ValidProject() => new
    {
        title = "Test project",
        description = "A project created by an integration test.",
        category = "Testing",
        githubUrl = "https://github.com/example/test",
        date = "2026-10-19T11:00:00Z"
    };

    private static object ValidBlogPost() => new
    {
        title = "Test post",
        content = "A blog post created by an integration test.",
        publicationDate = "2026-10-19T11:00:00Z"
    };

    private sealed record ProjectResponse(int Id, string Title);
    private sealed record BlogPostResponse(int Id, string Title, string Content);
}
