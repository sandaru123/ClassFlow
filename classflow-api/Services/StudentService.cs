using ClassFlow.Api.Constants;
using ClassFlow.Api.Data;
using ClassFlow.Api.DTOs.Students;
using ClassFlow.Api.Entities;
using ClassFlow.Api.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ClassFlow.Api.Services;

public class StudentService : IStudentService
{
    private const string DeleteConflictMessage = "This record cannot be permanently deleted because it has related data. Please deactivate it instead.";

    private readonly AppDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;

    public StudentService(AppDbContext dbContext, UserManager<ApplicationUser> userManager)
    {
        _dbContext = dbContext;
        _userManager = userManager;
    }

    public async Task<IReadOnlyList<StudentResponse>> GetAllAsync()
    {
        return await _dbContext.Students
            .AsNoTracking()
            .OrderBy(x => x.FirstName)
            .ThenBy(x => x.LastName)
            .Select(MapToResponseExpression())
            .ToListAsync();
    }

    public async Task<StudentResponse> GetByIdAsync(int id)
    {
        var student = await _dbContext.Students
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(MapToResponseExpression())
            .SingleOrDefaultAsync();

        if (student is null)
        {
            throw new KeyNotFoundException($"Student with id {id} was not found.");
        }

        return student;
    }

    public async Task<StudentResponse> CreateAsync(CreateStudentRequest request)
    {
        var normalizedEmail = NormalizeOptionalValue(request.Email);

        await EnsureStudentEmailIsUniqueAsync(normalizedEmail);

        if (!request.CreateLoginAccount)
        {
            var student = new Student
            {
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Email = normalizedEmail,
                PhoneNumber = NormalizeOptionalValue(request.PhoneNumber),
                Address = NormalizeOptionalValue(request.Address),
                DateOfBirth = request.DateOfBirth,
                IsActive = true,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _dbContext.Students.Add(student);
            await _dbContext.SaveChangesAsync();

            return MapToResponse(student);
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

            var addRoleResult = await _userManager.AddToRoleAsync(user, AppRoles.Student);
            if (!addRoleResult.Succeeded)
            {
                throw new InvalidOperationException(FormatErrors(addRoleResult.Errors));
            }

            var student = new Student
            {
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                Email = normalizedEmail,
                PhoneNumber = NormalizeOptionalValue(request.PhoneNumber),
                Address = NormalizeOptionalValue(request.Address),
                DateOfBirth = request.DateOfBirth,
                ApplicationUserId = user.Id,
                IsActive = true,
                CreatedAt = now
            };

            _dbContext.Students.Add(student);
            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            return MapToResponse(student);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<StudentResponse> UpdateAsync(int id, UpdateStudentRequest request)
    {
        var student = await _dbContext.Students
            .Include(x => x.ApplicationUser)
            .SingleOrDefaultAsync(x => x.Id == id);

        if (student is null)
        {
            throw new KeyNotFoundException($"Student with id {id} was not found.");
        }

        var normalizedEmail = NormalizeOptionalValue(request.Email);
        await EnsureStudentEmailIsUniqueAsync(normalizedEmail, id);

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            if (!string.IsNullOrWhiteSpace(student.ApplicationUserId))
            {
                if (string.IsNullOrWhiteSpace(normalizedEmail))
                {
                    throw new InvalidOperationException("Email is required for students with a linked login account.");
                }

                await EnsureIdentityEmailIsAvailableAsync(normalizedEmail, student.ApplicationUserId);

                var linkedUser = student.ApplicationUser
                    ?? await _userManager.FindByIdAsync(student.ApplicationUserId)
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

            student.FirstName = request.FirstName.Trim();
            student.LastName = request.LastName.Trim();
            student.Email = normalizedEmail;
            student.PhoneNumber = NormalizeOptionalValue(request.PhoneNumber);
            student.Address = NormalizeOptionalValue(request.Address);
            student.DateOfBirth = request.DateOfBirth;
            student.IsActive = request.IsActive;
            student.UpdatedAt = DateTimeOffset.UtcNow;

            await _dbContext.SaveChangesAsync();
            await transaction.CommitAsync();

            return MapToResponse(student);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task DeactivateAsync(int id)
    {
        var student = await _dbContext.Students
            .Include(x => x.ApplicationUser)
            .SingleOrDefaultAsync(x => x.Id == id);

        if (student is null)
        {
            throw new KeyNotFoundException($"Student with id {id} was not found.");
        }

        if (!student.IsActive)
        {
            return;
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            student.IsActive = false;
            student.UpdatedAt = DateTimeOffset.UtcNow;

            if (student.ApplicationUser is not null)
            {
                student.ApplicationUser.IsActive = false;
                student.ApplicationUser.UpdatedAt = DateTimeOffset.UtcNow;

                var updateUserResult = await _userManager.UpdateAsync(student.ApplicationUser);
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
        var student = await _dbContext.Students
            .Include(x => x.ApplicationUser)
            .SingleOrDefaultAsync(x => x.Id == id);

        if (student is null)
        {
            throw new KeyNotFoundException($"Student with id {id} was not found.");
        }

        if (student.IsActive)
        {
            return;
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            student.IsActive = true;
            student.UpdatedAt = DateTimeOffset.UtcNow;

            if (student.ApplicationUser is not null)
            {
                student.ApplicationUser.IsActive = true;
                student.ApplicationUser.UpdatedAt = DateTimeOffset.UtcNow;

                var updateUserResult = await _userManager.UpdateAsync(student.ApplicationUser);
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
        var student = await _dbContext.Students
            .Include(x => x.ApplicationUser)
            .SingleOrDefaultAsync(x => x.Id == id);

        if (student is null)
        {
            throw new KeyNotFoundException($"Student with id {id} was not found.");
        }

        var hasRelatedData = await _dbContext.Enrollments.AnyAsync(x => x.StudentId == id)
            || await _dbContext.AttendanceRecords.AnyAsync(x => x.StudentId == id)
            || await _dbContext.Payments.AnyAsync(x => x.StudentId == id);

        if (hasRelatedData)
        {
            throw new InvalidOperationException(DeleteConflictMessage);
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();
        try
        {
            _dbContext.Students.Remove(student);
            await _dbContext.SaveChangesAsync();

            if (student.ApplicationUser is not null)
            {
                var deleteUserResult = await _userManager.DeleteAsync(student.ApplicationUser);
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

    private async Task EnsureStudentEmailIsUniqueAsync(string? email, int? existingStudentId = null)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return;
        }

        var exists = await _dbContext.Students.AnyAsync(x =>
            x.Email != null &&
            x.Email.ToLower() == email.ToLower() &&
            (!existingStudentId.HasValue || x.Id != existingStudentId.Value));

        if (exists)
        {
            throw new InvalidOperationException("A student with this email already exists.");
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

    private static StudentResponse MapToResponse(Student student)
    {
        return new StudentResponse
        {
            Id = student.Id,
            FirstName = student.FirstName,
            LastName = student.LastName,
            Email = student.Email,
            PhoneNumber = student.PhoneNumber,
            Address = student.Address,
            DateOfBirth = student.DateOfBirth,
            HasLoginAccount = !string.IsNullOrWhiteSpace(student.ApplicationUserId),
            IsActive = student.IsActive,
            CreatedAt = student.CreatedAt,
            UpdatedAt = student.UpdatedAt
        };
    }

    private static System.Linq.Expressions.Expression<Func<Student, StudentResponse>> MapToResponseExpression()
    {
        return student => new StudentResponse
        {
            Id = student.Id,
            FirstName = student.FirstName,
            LastName = student.LastName,
            Email = student.Email,
            PhoneNumber = student.PhoneNumber,
            Address = student.Address,
            DateOfBirth = student.DateOfBirth,
            HasLoginAccount = student.ApplicationUserId != null,
            IsActive = student.IsActive,
            CreatedAt = student.CreatedAt,
            UpdatedAt = student.UpdatedAt
        };
    }

    private static string FormatErrors(IEnumerable<IdentityError> errors)
    {
        return string.Join("; ", errors.Select(error => error.Description));
    }
}
