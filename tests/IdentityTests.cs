using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using MauriceSinon.Api.Identity;
using Xunit;

namespace MauriceSinon.Api.Tests;

public sealed class IdentityTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task All_expected_roles_are_seeded()
    {
        using var scope = factory.Services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        foreach (var role in IdentityRoles.All)
            Assert.True(await roleManager.RoleExistsAsync(role));
    }
}
