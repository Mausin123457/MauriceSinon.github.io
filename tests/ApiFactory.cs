using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.Identity;

namespace MauriceSinon.Api.Tests;

public sealed class ApiFactory : WebApplicationFactory<Program>
{
    public const string Username = "test-admin";
    public const string Password = "CorrectHorseBatteryStaple!";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("Admin:Username", Username);
        builder.UseSetting("ConnectionStrings:Portfolio", "Testing");
        builder.UseSetting(
            "Admin:PasswordHash",
            new PasswordHasher<object>().HashPassword(null!, Password));
        builder.UseSetting("AllowedHosts", "*");
    }
}
