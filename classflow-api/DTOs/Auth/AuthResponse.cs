namespace ClassFlow.Api.DTOs.Auth;

public class AuthResponse
{
    public string UserId { get; set; } = string.Empty;

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public IReadOnlyList<string> Roles { get; set; } = Array.Empty<string>();

    public string Token { get; set; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; set; }
}
