using System.Security.Cryptography;
using System.Text;

namespace MauriceSinon.Api.Security;

public sealed class CsrfMiddleware(RequestDelegate next)
{
    public const string CookieName = "maurice-csrf";
    private const string HeaderName = "X-CSRF-TOKEN";

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.User.Identity?.IsAuthenticated == true &&
            (HttpMethods.IsPost(context.Request.Method) ||
             HttpMethods.IsPut(context.Request.Method) ||
             HttpMethods.IsDelete(context.Request.Method)))
        {
            var cookieToken = context.Request.Cookies[CookieName];
            var headerToken = context.Request.Headers[HeaderName].ToString();
            if (string.IsNullOrWhiteSpace(cookieToken) ||
                string.IsNullOrWhiteSpace(headerToken) ||
                !CryptographicOperations.FixedTimeEquals(
                    Encoding.UTF8.GetBytes(cookieToken),
                    Encoding.UTF8.GetBytes(headerToken)))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                await context.Response.WriteAsJsonAsync(new
                {
                    title = "CSRF validation failed",
                    status = StatusCodes.Status403Forbidden
                });
                return;
            }
        }

        await next(context);
    }

    public static string CreateToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');

    public static void SetTokenCookie(HttpResponse response, string token) =>
        response.Cookies.Append(CookieName, token, new CookieOptions
        {
            HttpOnly = false,
            SameSite = SameSiteMode.Strict,
            Secure = false,
            Path = "/"
        });
}
