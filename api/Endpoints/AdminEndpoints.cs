using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using MauriceSinon.Api.Security;

namespace MauriceSinon.Api.Endpoints;

public static class AdminEndpoints
{
    public static IEndpointRouteBuilder MapAdminEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/admin").WithTags("Admin");

        group.MapPost("/login", async (
            LoginRequest request,
            AdminAuthenticationService authentication,
            HttpContext httpContext) =>
        {
            if (!authentication.VerifyPassword(request.Username, request.Password))
                return Results.Unauthorized();

            await httpContext.SignInAsync(
                "Cookies",
                authentication.CreatePrincipal(),
                new AuthenticationProperties { IsPersistent = false });
            CsrfMiddleware.SetTokenCookie(httpContext.Response, CsrfMiddleware.CreateToken());
            return Results.Ok(new { username = authentication.Username });
        })
        .AllowAnonymous()
        .WithName("AdminLogin");

        group.MapPost("/logout", async (HttpContext httpContext) =>
        {
            await httpContext.SignOutAsync("Cookies");
            httpContext.Response.Cookies.Delete(CsrfMiddleware.CookieName);
            return Results.NoContent();
        })
        .RequireAuthorization()
        .WithName("AdminLogout");

        group.MapGet("/session", (ClaimsPrincipal user) =>
                Results.Ok(new { username = user.Identity?.Name }))
            .RequireAuthorization()
            .WithName("AdminSession");

        group.MapGet("/csrf", (HttpContext httpContext) =>
        {
            var token = httpContext.Request.Cookies[CsrfMiddleware.CookieName];
            if (string.IsNullOrWhiteSpace(token))
            {
                token = CsrfMiddleware.CreateToken();
                CsrfMiddleware.SetTokenCookie(httpContext.Response, token);
            }

            return Results.Ok(new { token });
        })
        .RequireAuthorization()
        .WithName("AdminCsrfToken");

        return endpoints;
    }

    public sealed record LoginRequest
    {
        [Required, StringLength(100)]
        public required string Username { get; init; }

        [Required, StringLength(200, MinimumLength = 12)]
        public required string Password { get; init; }
    }
}
