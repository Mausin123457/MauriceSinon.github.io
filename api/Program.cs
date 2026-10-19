using Microsoft.EntityFrameworkCore;
using MauriceSinon.Api.Data;
using MauriceSinon.Api.Endpoints;
using MauriceSinon.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddAuthorization();
builder.Services.AddDbContext<PortfolioDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Portfolio")));
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
app.UseCors("PortfolioFrontend");
app.UseAuthorization();
app.MapProjectEndpoints();
app.MapBlogPostEndpoints();

app.Run();
