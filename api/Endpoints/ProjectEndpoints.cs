using MauriceSinon.Api.Dtos;
using MauriceSinon.Api.Services;

namespace MauriceSinon.Api.Endpoints;

public static class ProjectEndpoints
{
    public static IEndpointRouteBuilder MapProjectEndpoints(
        this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/projects")
            .WithTags("Projects");

        group.MapGet("/", async (
            IProjectService projects,
            CancellationToken cancellationToken) =>
            Results.Ok(await projects.GetAllAsync(cancellationToken)))
            .WithName("GetProjects");

        group.MapGet("/{id:int}", async (
            int id,
            IProjectService projects,
            CancellationToken cancellationToken) =>
        {
            var project = await projects.GetByIdAsync(id, cancellationToken);
            return project is null ? Results.NotFound() : Results.Ok(project);
        })
        .WithName("GetProject");

        group.MapPost("/", async (
            ProjectInputDto input,
            IProjectService projects,
            CancellationToken cancellationToken) =>
        {
            var project = await projects.CreateAsync(input, cancellationToken);
            return Results.Created($"/api/projects/{project.Id}", project);
        }).RequireAuthorization();

        group.MapPut("/{id:int}", async (
            int id,
            ProjectInputDto input,
            IProjectService projects,
            CancellationToken cancellationToken) =>
            await projects.UpdateAsync(id, input, cancellationToken)
                ? Results.NoContent()
                : Results.NotFound()).RequireAuthorization();

        group.MapDelete("/{id:int}", async (
            int id,
            IProjectService projects,
            CancellationToken cancellationToken) =>
            await projects.DeleteAsync(id, cancellationToken)
                ? Results.NoContent()
                : Results.NotFound()).RequireAuthorization();

        return endpoints;
    }
}
