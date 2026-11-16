using System.ComponentModel.DataAnnotations;

namespace MauriceSinon.Api.Dtos;

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
