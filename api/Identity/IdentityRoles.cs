namespace MauriceSinon.Api.Identity;

public static class IdentityRoles
{
    public const string Guest = "Gast";
    public const string Editor = "Editor";
    public const string Admin = "Admin";
    public const string EditorOrAdminPolicy = "EditorOrAdmin";

    public static readonly IReadOnlyList<string> All = [Guest, Editor, Admin];
}
