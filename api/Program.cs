using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using MauriceSinon.Api.Data;
using MauriceSinon.Api.Endpoints;
using MauriceSinon.Api.Security;
using MauriceSinon.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddValidation();
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
    });
builder.Services.AddAuthorization();
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
    options.AddPolicy("PortfolioFrontend", policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var database = scope.ServiceProvider.GetRequiredService<PortfolioDbContext>();
    database.Database.EnsureCreated();
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseCors("PortfolioFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.UseMiddleware<CsrfMiddleware>();
app.MapAdminEndpoints();
app.MapProjectEndpoints();
app.MapBlogPostEndpoints();

app.Run();

public partial class Program;
