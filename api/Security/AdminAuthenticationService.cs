using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;

namespace MauriceSinon.Api.Security;

public sealed class AdminAuthenticationService(IConfiguration configuration)
{
    private readonly PasswordHasher<object> passwordHasher = new();

    public string? Username => configuration["Admin:Username"];

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(Username) &&
        !string.IsNullOrWhiteSpace(configuration["Admin:PasswordHash"]);

    public bool VerifyPassword(string username, string password)
    {
        var configuredUsername = Username;
        var passwordHash = configuration["Admin:PasswordHash"];
        if (!IsConfigured || !string.Equals(username, configuredUsername, StringComparison.Ordinal))
            return false;

        return passwordHasher.VerifyHashedPassword(null!, passwordHash!, password)
            != PasswordVerificationResult.Failed;
    }

    public ClaimsPrincipal CreatePrincipal() =>
        new(new ClaimsIdentity(
            [new Claim(ClaimTypes.Name, Username!)],
            CookieAuthenticationDefaults.AuthenticationScheme,
            ClaimTypes.Name,
            ClaimTypes.Role));
}
