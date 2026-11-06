using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using MauriceSinon.Api.Identity;
using Xunit;

namespace MauriceSinon.Api.Tests;

public sealed class AuthApiTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Registration_creates_a_guest_user()
    {
        using var client = factory.CreateClient();
        var username = $"guest-{Guid.NewGuid():N}";

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            username,
            password = "ValidPassword123!"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.FindByNameAsync(username);
        Assert.NotNull(user);
        Assert.Equal([IdentityRoles.Guest], await userManager.GetRolesAsync(user!));
    }

    [Fact]
    public async Task Registration_rejects_duplicate_username()
    {
        using var client = factory.CreateClient();
        var username = $"duplicate-{Guid.NewGuid():N}";
        var request = new { username, password = "ValidPassword123!" };

        Assert.Equal(HttpStatusCode.Created,
            (await client.PostAsJsonAsync("/api/auth/register", request)).StatusCode);
        var duplicate = await client.PostAsJsonAsync("/api/auth/register", request);

        Assert.Equal(HttpStatusCode.Conflict, duplicate.StatusCode);
    }

    [Fact]
    public async Task Registration_rejects_invalid_password()
    {
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            username = $"invalid-{Guid.NewGuid():N}",
            password = "weak"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Registration_cannot_assign_an_elevated_role()
    {
        using var client = factory.CreateClient();
        var username = $"no-escalation-{Guid.NewGuid():N}";

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            username,
            password = "ValidPassword123!",
            role = IdentityRoles.Admin
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.FindByNameAsync(username);
        Assert.NotNull(user);
        Assert.DoesNotContain(IdentityRoles.Admin, await userManager.GetRolesAsync(user!));
        Assert.DoesNotContain(IdentityRoles.Editor, await userManager.GetRolesAsync(user!));
    }

    [Fact]
    public async Task Login_returns_an_identity_cookie_and_allows_authenticated_session()
    {
        using var registered = await CreateRegisteredClient();
        using var client = registered.Client;
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            username = registered.Username,
            password = "ValidPassword123!"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(
            "maurice-identity=",
            string.Join("; ", response.Headers.GetValues("Set-Cookie")));

        var session = await client.GetAsync("/api/admin/session");
        Assert.Equal(HttpStatusCode.OK, session.StatusCode);
    }

    [Fact]
    public async Task Login_with_invalid_password_returns_unauthorized()
    {
        using var registered = await CreateRegisteredClient();
        using var client = registered.Client;

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            username = registered.Username,
            password = "WrongPassword123!"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_removes_the_authenticated_session()
    {
        using var registered = await CreateRegisteredClient();
        using var client = registered.Client;
        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            username = registered.Username,
            password = "ValidPassword123!"
        });
        login.EnsureSuccessStatusCode();

        var csrf = await client.GetAsync("/api/admin/csrf");
        csrf.EnsureSuccessStatusCode();
        var csrfToken = await csrf.Content.ReadFromJsonAsync<CsrfResponse>();
        client.DefaultRequestHeaders.Add("X-CSRF-TOKEN", csrfToken!.Token);

        var logout = await client.PostAsync("/api/auth/logout", null);
        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.GetAsync("/api/admin/session")).StatusCode);
    }

    private async Task<RegisteredClient> CreateRegisteredClient()
    {
        var client = factory.CreateClient();
        var username = $"login-{Guid.NewGuid():N}";
        var registration = await client.PostAsJsonAsync("/api/auth/register", new
        {
            username,
            password = "ValidPassword123!"
        });
        registration.EnsureSuccessStatusCode();
        return new RegisteredClient(client, username);
    }

    private sealed record RegisteredClient(HttpClient Client, string Username) : IDisposable
    {
        public void Dispose() => Client.Dispose();
    }

    private sealed record CsrfResponse(string Token);
}
