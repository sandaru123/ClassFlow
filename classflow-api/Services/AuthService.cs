using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ClassFlow.Api.Constants;
using ClassFlow.Api.DTOs.Auth;
using ClassFlow.Api.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace ClassFlow.Api.Services;

public class AuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;

    public AuthService(UserManager<ApplicationUser> userManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _configuration = configuration;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var email = request.Email.Trim();
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser is not null)
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }

        var role = ResolveRegistrationRole(request.Role);

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            EmailConfirmed = true,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            throw new InvalidOperationException(FormatErrors(createResult.Errors));
        }

        var addRoleResult = await _userManager.AddToRoleAsync(user, role);
        if (!addRoleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);
            throw new InvalidOperationException(FormatErrors(addRoleResult.Errors));
        }

        return await BuildResponseAsync(user);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var email = request.Email.Trim();
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null || !await _userManager.CheckPasswordAsync(user, request.Password))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("User account is inactive.");
        }

        return await BuildResponseAsync(user);
    }

    private async Task<AuthResponse> BuildResponseAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var expiresAt = DateTimeOffset.UtcNow.AddMinutes(GetJwtExpiryMinutes());
        var token = CreateToken(user, roles, expiresAt);

        return new AuthResponse
        {
            UserId = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email ?? string.Empty,
            Roles = roles.ToArray(),
            Token = token,
            ExpiresAt = expiresAt
        };
    }

    private string CreateToken(ApplicationUser user, IEnumerable<string> roles, DateTimeOffset expiresAt)
    {
        var jwtSection = _configuration.GetSection("Jwt");
        var issuer = jwtSection["Issuer"] ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
        var audience = jwtSection["Audience"] ?? throw new InvalidOperationException("Jwt:Audience is not configured.");
        var key = jwtSection["Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured.");

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}".Trim()),
            new(ClaimTypes.Email, user.Email ?? string.Empty)
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt.UtcDateTime,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private int GetJwtExpiryMinutes()
    {
        var value = _configuration["Jwt:ExpiryMinutes"];
        if (!int.TryParse(value, out var minutes) || minutes <= 0)
        {
            throw new InvalidOperationException("Jwt:ExpiryMinutes must be a positive number.");
        }

        return minutes;
    }

    private static string ResolveRegistrationRole(string? requestedRole)
    {
        var role = string.IsNullOrWhiteSpace(requestedRole) ? AppRoles.Student : requestedRole.Trim();
        var normalizedRole = AppRoles.All.FirstOrDefault(value => string.Equals(value, role, StringComparison.OrdinalIgnoreCase));

        if (normalizedRole is null)
        {
            throw new ArgumentException($"Invalid role '{role}'.");
        }

        if (!AppRoles.Registerable.Contains(normalizedRole, StringComparer.OrdinalIgnoreCase))
        {
            throw new ArgumentException("Registration is only allowed for Student or Parent roles.");
        }

        return normalizedRole;
    }

    private static string FormatErrors(IEnumerable<IdentityError> errors)
    {
        return string.Join("; ", errors.Select(error => error.Description));
    }
}
