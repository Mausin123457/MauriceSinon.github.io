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
}
