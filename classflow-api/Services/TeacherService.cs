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
        var teacher = await _dbContext.Teachers.SingleOrDefaultAsync(x => x.Id == id);
        if (teacher is null)
        {
            throw new KeyNotFoundException($"Teacher with id {id} was not found.");
        }

        await EnsureTeacherEmailIsUniqueAsync(request.Email, id);

        teacher.FirstName = request.FirstName.Trim();
        teacher.LastName = request.LastName.Trim();
        teacher.Email = NormalizeOptionalValue(request.Email);
        teacher.PhoneNumber = NormalizeOptionalValue(request.PhoneNumber);
        teacher.Address = NormalizeOptionalValue(request.Address);
        teacher.IsActive = request.IsActive;
        teacher.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync();

        return MapToResponse(teacher);
    }

    public async Task DeactivateAsync(int id)
    {
        var teacher = await _dbContext.Teachers.SingleOrDefaultAsync(x => x.Id == id);
        if (teacher is null)
        {
            throw new KeyNotFoundException($"Teacher with id {id} was not found.");
        }

        if (!teacher.IsActive)
        {
            return;
        }

        teacher.IsActive = false;
        teacher.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync();
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

    private async Task EnsureIdentityEmailIsAvailableAsync(string email)
    {
        var existingUser = await _userManager.FindByEmailAsync(email);
        if (existingUser is not null)
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
