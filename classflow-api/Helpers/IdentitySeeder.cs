using ClassFlow.Api.Constants;
using ClassFlow.Api.Entities;
using Microsoft.AspNetCore.Identity;

namespace ClassFlow.Api.Helpers;

public static class IdentitySeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();

        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

        foreach (var role in AppRoles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                var createRoleResult = await roleManager.CreateAsync(new IdentityRole(role));
                if (!createRoleResult.Succeeded)
                {
                    throw new InvalidOperationException(FormatErrors(createRoleResult.Errors));
                }
            }
        }

        var superAdminSection = configuration.GetSection("SeedUsers:SuperAdmin");
        var email = superAdminSection["Email"]?.Trim();
        var password = superAdminSection["Password"];
        var firstName = superAdminSection["FirstName"]?.Trim();
        var lastName = superAdminSection["LastName"]?.Trim();

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            throw new InvalidOperationException("SeedUsers:SuperAdmin configuration is missing Email or Password.");
        }

        var user = await userManager.FindByEmailAsync(email);
        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FirstName = string.IsNullOrWhiteSpace(firstName) ? "Super" : firstName,
                LastName = string.IsNullOrWhiteSpace(lastName) ? "Admin" : lastName,
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow
            };

            var createUserResult = await userManager.CreateAsync(user, password);
            if (!createUserResult.Succeeded)
            {
                throw new InvalidOperationException(FormatErrors(createUserResult.Errors));
            }
        }

        if (!await userManager.IsInRoleAsync(user, AppRoles.SuperAdmin))
        {
            var addRoleResult = await userManager.AddToRoleAsync(user, AppRoles.SuperAdmin);
            if (!addRoleResult.Succeeded)
            {
                throw new InvalidOperationException(FormatErrors(addRoleResult.Errors));
            }
        }
    }

    private static string FormatErrors(IEnumerable<IdentityError> errors)
    {
        return string.Join("; ", errors.Select(error => error.Description));
    }
}
