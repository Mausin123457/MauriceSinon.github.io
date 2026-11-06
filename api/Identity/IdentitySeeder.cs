using Microsoft.AspNetCore.Identity;

namespace MauriceSinon.Api.Identity;

public static class IdentitySeeder
{
    public static async Task SeedAsync(
        RoleManager<IdentityRole> roleManager,
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        foreach (var role in IdentityRoles.All)
        {
            if (await roleManager.RoleExistsAsync(role))
                continue;

            var result = await roleManager.CreateAsync(new IdentityRole(role));
            ThrowIfFailed(result, $"role '{role}'");
        }

        if (!environment.IsDevelopment())
            return;

        await SeedLocalUserAsync(
            userManager,
            configuration,
            IdentityRoles.Admin,
            "Identity:Admin");
        await SeedLocalUserAsync(
            userManager,
            configuration,
            IdentityRoles.Editor,
            "Identity:Editor");
    }

    private static async Task SeedLocalUserAsync(
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration,
        string role,
        string configurationPath)
    {
        var username = configuration[$"{configurationPath}:Username"];
        var password = configuration[$"{configurationPath}:Password"];

        if (string.IsNullOrWhiteSpace(username) && string.IsNullOrWhiteSpace(password))
            return;

        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException(
                $"Both {configurationPath}:Username and {configurationPath}:Password must be configured together.");
        }

        var user = await userManager.FindByNameAsync(username);
        if (user is null)
        {
            user = new ApplicationUser { UserName = username };
            var createResult = await userManager.CreateAsync(user, password);
            ThrowIfFailed(createResult, $"user '{username}'");
        }

        if (!await userManager.IsInRoleAsync(user, role))
        {
            var roleResult = await userManager.AddToRoleAsync(user, role);
            ThrowIfFailed(roleResult, $"assigning role '{role}' to user '{username}'");
        }
    }

    private static void ThrowIfFailed(IdentityResult result, string operation)
    {
        if (result.Succeeded)
            return;

        var errors = string.Join(
            "; ",
            result.Errors.Select(error => $"{error.Code}: {error.Description}"));
        throw new InvalidOperationException($"Could not complete {operation}: {errors}");
    }
}
