using System.Linq.Expressions;
using ClassFlow.Api.Constants;
using ClassFlow.Api.Data;
using ClassFlow.Api.DTOs.Teachers;
using ClassFlow.Api.Entities;
using ClassFlow.Api.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ClassFlow.Api.Services;

public class TeacherService : ITeacherService
{
    private const string DeleteConflictMessage = "This record cannot be permanently deleted because it has related data. Please deactivate it instead.";

    private readonly AppDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;

    public TeacherService(AppDbContext dbContext, UserManager<ApplicationUser> userManager)
    {
        _dbContext = dbContext;
        _userManager = userManager;
    }

    public async Task<IReadOnlyList<TeacherResponse>> GetAllAsync()
    {
        return await _dbContext.Teachers
            .AsNoTracking()
            .OrderBy(x => x.FirstName)
            .ThenBy(x => x.LastName)
            .Select(MapToResponseExpression())
            .ToListAsync();
    }

    public async Task<TeacherResponse> GetByIdAsync(int id)
    {
        var teacher = await _dbContext.Teachers
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(MapToResponseExpression())
            .SingleOrDefaultAsync();

        if (teacher is null)
        {
            throw new KeyNotFoundException($"Teacher with id {id} was not found.");
        }

        return teacher;
    }

    public async Task<TeacherResponse> CreateAsync(CreateTeacherRequest request)
    {
        var normalizedEmail = NormalizeOptionalValue(request.Email);
        await EnsureTeacherEmailIsUniqueAsync(normalizedEmail);

        if (!request.CreateLoginAccount)
        {
            var teacher = new Teacher
            {
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Email = normalizedEmail,
                PhoneNumber = NormalizeOptionalValue(request.PhoneNumber),
                Address = NormalizeOptionalValue(request.Address),
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _dbContext.Teachers.Add(teacher);
            await _dbContext.SaveChangesAsync();

            return MapToResponse(teacher);
        }

        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            throw new InvalidOperationException("Email is required when creating a login account.");
        }

        if (string.IsNullOrWhiteSpace(request.TemporaryPassword))
        {
            throw new InvalidOperationException("TemporaryPassword is required when creating a login account.");
        }

        await EnsureIdentityEmailIsAvailableAsync(normalizedEmail);

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            var now = DateTimeOffset.UtcNow;
            var user = new ApplicationUser
            {
                UserName = normalizedEmail,
                Email = normalizedEmail,
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                EmailConfirmed = true,
                IsActive = true,
                CreatedAt = now
            };

            var createUserResult = await _userManager.CreateAsync(user, request.TemporaryPassword);
            if (!createUserResult.Succeeded)
            {
                throw new InvalidOperationException(FormatErrors(createUserResult.Errors));
            }

            var addRoleResult = await _userManager.AddToRoleAsync(user, AppRoles.Teacher);
            if (!addRoleResult.Succeeded)
            {
                throw new InvalidOperationException(FormatErrors(addRoleResult.Errors));
            }

            var teacher = new Teacher
            {
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Email = normalizedEmail,
                PhoneNumber = NormalizeOptionalValue(request.PhoneNumber),
                Address = NormalizeOptionalValue(request.Address),
                ApplicationUserId = user.Id,
                IsActive = true,
                CreatedAt = now
            };

            _dbContext.Teachers.Add(teacher);
            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            return MapToResponse(teacher);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<TeacherResponse> UpdateAsync(int id, UpdateTeacherRequest request)
    {
        var teacher = await _dbContext.Teachers
            .Include(x => x.ApplicationUser)
            .SingleOrDefaultAsync(x => x.Id == id);

        if (teacher is null)
        {
            throw new KeyNotFoundException($"Teacher with id {id} was not found.");
        }

        var normalizedEmail = NormalizeOptionalValue(request.Email);
        await EnsureTeacherEmailIsUniqueAsync(normalizedEmail, id);

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            if (!string.IsNullOrWhiteSpace(teacher.ApplicationUserId))
            {
                if (string.IsNullOrWhiteSpace(normalizedEmail))
                {
                    throw new InvalidOperationException("Email is required for teachers with a linked login account.");
                }

                await EnsureIdentityEmailIsAvailableAsync(normalizedEmail, teacher.ApplicationUserId);

                var linkedUser = teacher.ApplicationUser
                    ?? await _userManager.FindByIdAsync(teacher.ApplicationUserId)
                    ?? throw new InvalidOperationException("The linked login account could not be found.");

                linkedUser.UserName = normalizedEmail;
                linkedUser.Email = normalizedEmail;
                linkedUser.FirstName = request.FirstName.Trim();
                linkedUser.LastName = request.LastName.Trim();
                linkedUser.IsActive = request.IsActive;
                linkedUser.UpdatedAt = DateTimeOffset.UtcNow;

                var updateUserResult = await _userManager.UpdateAsync(linkedUser);
                if (!updateUserResult.Succeeded)
                {
                    throw new InvalidOperationException(FormatErrors(updateUserResult.Errors));
                }
            }

            teacher.FirstName = request.FirstName.Trim();
            teacher.LastName = request.LastName.Trim();
            teacher.Email = normalizedEmail;
            teacher.PhoneNumber = NormalizeOptionalValue(request.PhoneNumber);
            teacher.Address = NormalizeOptionalValue(request.Address);
            teacher.IsActive = request.IsActive;
            teacher.UpdatedAt = DateTimeOffset.UtcNow;

            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            return MapToResponse(teacher);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task DeactivateAsync(int id)
    {
        var teacher = await _dbContext.Teachers
            .Include(x => x.ApplicationUser)
            .SingleOrDefaultAsync(x => x.Id == id);

        if (teacher is null)
        {
            throw new KeyNotFoundException($"Teacher with id {id} was not found.");
        }

        if (!teacher.IsActive)
        {
            return;
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            teacher.IsActive = false;
            teacher.UpdatedAt = DateTimeOffset.UtcNow;

            if (teacher.ApplicationUser is not null)
            {
                teacher.ApplicationUser.IsActive = false;
                teacher.ApplicationUser.UpdatedAt = DateTimeOffset.UtcNow;

                var updateUserResult = await _userManager.UpdateAsync(teacher.ApplicationUser);
                if (!updateUserResult.Succeeded)
                {
                    throw new InvalidOperationException(FormatErrors(updateUserResult.Errors));
                }
            }

            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task ReactivateAsync(int id)
    {
        var teacher = await _dbContext.Teachers
            .Include(x => x.ApplicationUser)
            .SingleOrDefaultAsync(x => x.Id == id);

        if (teacher is null)
        {
            throw new KeyNotFoundException($"Teacher with id {id} was not found.");
        }

        if (teacher.IsActive)
        {
            return;
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            teacher.IsActive = true;
            teacher.UpdatedAt = DateTimeOffset.UtcNow;

            if (teacher.ApplicationUser is not null)
            {
                teacher.ApplicationUser.IsActive = true;
                teacher.ApplicationUser.UpdatedAt = DateTimeOffset.UtcNow;

                var updateUserResult = await _userManager.UpdateAsync(teacher.ApplicationUser);
                if (!updateUserResult.Succeeded)
                {
                    throw new InvalidOperationException(FormatErrors(updateUserResult.Errors));
                }
            }

            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task DeleteForeverAsync(int id)
    {
        var teacher = await _dbContext.Teachers
            .Include(x => x.ApplicationUser)
            .SingleOrDefaultAsync(x => x.Id == id);

        if (teacher is null)
        {
            throw new KeyNotFoundException($"Teacher with id {id} was not found.");
        }

        var hasRelatedData = await _dbContext.Courses.AnyAsync(x => x.TeacherId == id)
            || await _dbContext.ClassSessions.AnyAsync(x => x.TeacherId == id);

        if (hasRelatedData)
        {
            throw new InvalidOperationException(DeleteConflictMessage);
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            _dbContext.Teachers.Remove(teacher);
            await _dbContext.SaveChangesAsync();

            if (teacher.ApplicationUser is not null)
            {
                var deleteUserResult = await _userManager.DeleteAsync(teacher.ApplicationUser);
                if (!deleteUserResult.Succeeded)
                {
                    throw new InvalidOperationException(FormatErrors(deleteUserResult.Errors));
                }
            }

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private async Task EnsureTeacherEmailIsUniqueAsync(string? email, int? existingTeacherId = null)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return;
        }

        var exists = await _dbContext.Teachers.AnyAsync(x =>
            x.Email != null &&
            x.Email.ToLower() == email.ToLower() &&
            (!existingTeacherId.HasValue || x.Id != existingTeacherId.Value));

        if (exists)
        {
            throw new InvalidOperationException("A teacher with this email already exists.");
        }
    }

    private async Task EnsureIdentityEmailIsAvailableAsync(string email, string? existingUserId = null)
    {
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser is not null && !string.Equals(existingUser.Id, existingUserId, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("A user with this email already exists.");
        }
    }

    private static string? NormalizeOptionalValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static TeacherResponse MapToResponse(Teacher teacher)
    {
        return new TeacherResponse
        {
            Id = teacher.Id,
            FirstName = teacher.FirstName,
            LastName = teacher.LastName,
            Email = teacher.Email,
            HasLoginAccount = !string.IsNullOrWhiteSpace(teacher.ApplicationUserId),
            PhoneNumber = teacher.PhoneNumber,
            Address = teacher.Address,
            IsActive = teacher.IsActive,
            CreatedAt = teacher.CreatedAt,
            UpdatedAt = teacher.UpdatedAt
        };
    }

    private static Expression<Func<Teacher, TeacherResponse>> MapToResponseExpression()
    {
        return teacher => new TeacherResponse
        {
            Id = teacher.Id,
            FirstName = teacher.FirstName,
            LastName = teacher.LastName,
            Email = teacher.Email,
            HasLoginAccount = teacher.ApplicationUserId != null,
            PhoneNumber = teacher.PhoneNumber,
            Address = teacher.Address,
            IsActive = teacher.IsActive,
            CreatedAt = teacher.CreatedAt,
            UpdatedAt = teacher.UpdatedAt
        };
    }

    private static string FormatErrors(IEnumerable<IdentityError> errors)
    {
        return string.Join("; ", errors.Select(error => error.Description));
    }
}
