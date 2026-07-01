using System.ComponentModel.DataAnnotations;

namespace ClassFlow.Api.DTOs.Auth;

public class RevokeRefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
