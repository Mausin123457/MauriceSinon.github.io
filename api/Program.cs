using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using MauriceSinon.Api.Data;
using MauriceSinon.Api.Endpoints;
using MauriceSinon.Api.Identity;
using MauriceSinon.Api.Security;
using MauriceSinon.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddValidation();
builder.Services.AddIdentityCore<ApplicationUser>(options =>
    {
        options.User.RequireUniqueEmail = false;
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<PortfolioDbContext>()
    .AddSignInManager();
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "maurice-admin";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Strict;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.LoginPath = "/admin.html";
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    })
    .AddCookie(IdentityConstants.ApplicationScheme, options =>
{
    options.Cookie.Name = "maurice-identity";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});
builder.Services.AddAuthorization(options =>
{
    options.DefaultPolicy = new AuthorizationPolicyBuilder(
            CookieAuthenticationDefaults.AuthenticationScheme,
            IdentityConstants.ApplicationScheme)
        .RequireAuthenticatedUser()
        .Build();
    options.AddPolicy(IdentityRoles.EditorOrAdminPolicy, policy =>
        policy.AddAuthenticationSchemes(
                CookieAuthenticationDefaults.AuthenticationScheme,
                IdentityConstants.ApplicationScheme)
            .RequireAuthenticatedUser()
            .RequireRole(IdentityRoles.Editor, IdentityRoles.Admin));
});
builder.Services.AddSingleton<AdminAuthenticationService>();
builder.Services.AddDbContext<PortfolioDbContext>(options =>
{
    if (builder.Environment.IsEnvironment("Testing"))
        options.UseInMemoryDatabase("MauriceSinonApiTests");
    else
        options.UseSqlServer(builder.Configuration.GetConnectionString("Portfolio"));
});
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IBlogPostService, BlogPostService>();
builder.Services.AddCors(options =>
{
    var allowedOrigins = builder.Configuration
        .GetSection("Cors:AllowedOrigins")
        .Get<string[]>();
    if (allowedOrigins is null || allowedOrigins.Length == 0)
        throw new InvalidOperationException(
            "Cors:AllowedOrigins must contain at least one trusted origin.");

    options.AddPolicy("PortfolioFrontend", policy =>
        policy.WithOrigins(allowedOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
    if (app.Environment.IsEnvironment("Testing"))
        database.Database.EnsureCreated();
    else
        database.Database.Migrate();

    await IdentitySeeder.SeedAsync(
        scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>(),
        scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>(),
        app.Configuration,
        app.Environment);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors("PortfolioFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<CsrfMiddleware>();
app.MapAuthEndpoints();
app.MapAdminEndpoints();
app.MapProjectEndpoints();
app.MapBlogPostEndpoints();

app.Run();