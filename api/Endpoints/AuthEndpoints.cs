using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using MauriceSinon.Api.Identity;
using MauriceSinon.Api.Security;

namespace MauriceSinon.Api.Endpoints;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/auth").WithTags("Authentication");

        group.MapPost("/register", async (
            RegistrationRequest request,
            UserManager<ApplicationUser> userManager) =>
        {
            var existingUser = await userManager.FindByNameAsync(request.Username);
            if (existingUser is not null)
                return Results.Conflict(new { error = "Username is already registered." });

            var user = new ApplicationUser { UserName = request.Username };
            var createResult = await userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
            {
                return Results.BadRequest(new
                {
                    errors = createResult.Errors.Select(error => error.Description)
                });
            }

            var roleResult = await userManager.AddToRoleAsync(user, IdentityRoles.Guest);
            if (roleResult.Succeeded)
                return Results.Created($"/api/auth/users/{user.Id}", new { username = user.UserName });

            await userManager.DeleteAsync(user);
            var roleErrors = roleResult.Errors.Select(error => error.Description);
            return Results.Problem(
                detail: string.Join("; ", roleErrors),
                statusCode: StatusCodes.Status500InternalServerError);
        })
        .AllowAnonymous()
        .WithName("Register");

        group.MapPost("/login", async (
            LoginRequest request,
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            HttpContext httpContext) =>
        {
            var user = await userManager.FindByNameAsync(request.Username);
            if (user is null)
                return Results.Unauthorized();

            var signInResult = await signInManager.CheckPasswordSignInAsync(
                user,
                request.Password,
                lockoutOnFailure: false);
            if (!signInResult.Succeeded)
                return Results.Unauthorized();

            await signInManager.SignInAsync(user, isPersistent: false);
            CsrfMiddleware.SetTokenCookie(
                httpContext.Response,
                CsrfMiddleware.CreateToken());
            return Results.Ok(new { username = user.UserName });
        })
        .AllowAnonymous()
        .WithName("Login");

        group.MapPost("/logout", async (
            SignInManager<ApplicationUser> signInManager,
            HttpContext httpContext) =>
        {
            await signInManager.SignOutAsync();
            httpContext.Response.Cookies.Delete(CsrfMiddleware.CookieName);
            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("Logout");

        return endpoints;
    }

    public sealed record RegistrationRequest
    {
        [Required, StringLength(100, MinimumLength = 3)]
        public required string Username { get; init; }

        [Required, StringLength(200, MinimumLength = 12)]
        public required string Password { get; init; }
    }

    public sealed record LoginRequest
    {
        [Required, StringLength(100)]
        public required string Username { get; init; }

        [Required, StringLength(200)]
        public required string Password { get; init; }
    }
}
