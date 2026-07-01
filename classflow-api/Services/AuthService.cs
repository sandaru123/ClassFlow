using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ClassFlow.Api.Constants;
using ClassFlow.Api.Data;
using ClassFlow.Api.DTOs.Auth;
using ClassFlow.Api.Entities;
using ClassFlow.Api.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace ClassFlow.Api.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;

    public AuthService(
        AppDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration)
    {
        _dbContext = dbContext;
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

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
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
                throw new InvalidOperationException(FormatErrors(addRoleResult.Errors));
            }

            var response = await IssueTokensAsync(user);
            await transaction.CommitAsync();
            return response;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
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

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            var response = await IssueTokensAsync(user);
            await transaction.CommitAsync();
            return response;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<AuthResponse> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var refreshTokenValue = request.RefreshToken.Trim();
        if (string.IsNullOrWhiteSpace(refreshTokenValue))
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            var refreshTokenHash = HashToken(refreshTokenValue);
            var refreshToken = await _dbContext.RefreshTokens
                .Include(x => x.User)
                .SingleOrDefaultAsync(x => x.TokenHash == refreshTokenHash);

            ValidateRefreshToken(refreshToken);

            var response = await IssueTokensAsync(refreshToken!.User, refreshToken);
            await transaction.CommitAsync();
            return response;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task RevokeRefreshTokenAsync(RevokeRefreshTokenRequest request)
    {
        var refreshTokenValue = request.RefreshToken.Trim();
        if (string.IsNullOrWhiteSpace(refreshTokenValue))
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable);
        try
        {
            var refreshTokenHash = HashToken(refreshTokenValue);
            var refreshToken = await _dbContext.RefreshTokens
                .Include(x => x.User)
                .SingleOrDefaultAsync(x => x.TokenHash == refreshTokenHash);

            ValidateRefreshToken(refreshToken);

            refreshToken!.RevokedAt = DateTimeOffset.UtcNow;
            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private async Task<AuthResponse> IssueTokensAsync(ApplicationUser user, RefreshToken? refreshTokenToRotate = null)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var now = DateTimeOffset.UtcNow;
        var accessTokenExpiresAt = now.AddMinutes(GetJwtExpiryMinutes());
        var accessToken = CreateAccessToken(user, roles, accessTokenExpiresAt);

        var refreshTokenValue = GenerateRefreshTokenValue();
        var refreshTokenHash = HashToken(refreshTokenValue);
        var refreshTokenExpiresAt = now.AddDays(GetRefreshTokenExpiryDays());

        if (refreshTokenToRotate is not null)
        {
            refreshTokenToRotate.RevokedAt = now;
            refreshTokenToRotate.ReplacedByToken = refreshTokenHash;
        }

        _dbContext.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            CreatedAt = now,
            ExpiresAt = refreshTokenExpiresAt
        });

        await _dbContext.SaveChangesAsync();

        return new AuthResponse
        {
            UserId = user.Id,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Email = user.Email ?? string.Empty,
            Roles = roles.ToArray(),
            AccessToken = accessToken,
            AccessTokenExpiresAt = accessTokenExpiresAt,
            RefreshToken = refreshTokenValue,
            RefreshTokenExpiresAt = refreshTokenExpiresAt
        };
    }

    private string CreateAccessToken(ApplicationUser user, IEnumerable<string> roles, DateTimeOffset expiresAt)
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

    private static string GenerateRefreshTokenValue()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes);
    }

    private static string HashToken(string token)
    {
        var bytes = Encoding.UTF8.GetBytes(token);
        return Convert.ToBase64String(SHA256.HashData(bytes));
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

    private int GetRefreshTokenExpiryDays()
    {
        var value = _configuration["Jwt:RefreshTokenExpiryDays"];
        if (!int.TryParse(value, out var days) || days <= 0)
        {
            throw new InvalidOperationException("Jwt:RefreshTokenExpiryDays must be a positive number.");
        }

        return days;
    }

    private static void ValidateRefreshToken(RefreshToken? refreshToken)
    {
        if (refreshToken is null || refreshToken.User is null)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }

        if (!refreshToken.User.IsActive)
        {
            throw new UnauthorizedAccessException("User account is inactive.");
        }

        var now = DateTimeOffset.UtcNow;
        if (refreshToken.RevokedAt.HasValue || refreshToken.ExpiresAt <= now)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }
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

