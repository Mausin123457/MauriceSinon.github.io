using System.Net;
using System.Net.Http.Json;
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
        using var client = CreateAuthenticatedClient();
        var create = await client.PostAsJsonAsync("/api/projects", ValidProject());
        var project = await create.Content.ReadFromJsonAsync<ProjectResponse>();

        var update = await client.PutAsJsonAsync($"/api/projects/{project!.Id}", new
        {
            title = "Updated project",
            description = "Updated description",
            category = "Updated",
            date = "2026-10-20T11:00:00Z"
        });
        var delete = await client.DeleteAsync($"/api/projects/{project.Id}");
        var missing = await client.GetAsync($"/api/projects/{project.Id}");

        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
    }

    [Fact]
    public async Task Admin_can_complete_blog_post_crud_cycle()
    {
        using var client = CreateAuthenticatedClient();
        var create = await client.PostAsJsonAsync("/api/blogposts", ValidBlogPost());
        var post = await create.Content.ReadFromJsonAsync<BlogPostResponse>();

        var update = await client.PutAsJsonAsync($"/api/blogposts/{post!.Id}", new
        {
            title = "Updated post",
            content = "Updated content",
            publicationDate = "2026-10-20T11:00:00Z"
        });
        var delete = await client.DeleteAsync($"/api/blogposts/{post.Id}");
        var missing = await client.GetAsync($"/api/blogposts/{post.Id}");

        Assert.Equal(HttpStatusCode.NoContent, update.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, delete.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, missing.StatusCode);
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
    private sealed record BlogPostResponse(int Id, string Title);
}
