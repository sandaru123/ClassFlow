using System.Linq.Expressions;
using ClassFlow.Api.Data;
using ClassFlow.Api.DTOs.Teachers;
using ClassFlow.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClassFlow.Api.Services;

public class TeacherService
{
    private readonly AppDbContext _dbContext;

    public TeacherService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
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
        await EnsureEmailIsUniqueAsync(request.Email);

        var teacher = new Teacher
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = NormalizeOptionalValue(request.Email),
            PhoneNumber = NormalizeOptionalValue(request.PhoneNumber),
            Address = NormalizeOptionalValue(request.Address),
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.Teachers.Add(teacher);
        await _dbContext.SaveChangesAsync();

        return MapToResponse(teacher);
    }

    public async Task<TeacherResponse> UpdateAsync(int id, UpdateTeacherRequest request)
    {
        var teacher = await _dbContext.Teachers.SingleOrDefaultAsync(x => x.Id == id);
        if (teacher is null)
        {
            throw new KeyNotFoundException($"Teacher with id {id} was not found.");
        }

        await EnsureEmailIsUniqueAsync(request.Email, id);

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

    private async Task EnsureEmailIsUniqueAsync(string? email, int? existingTeacherId = null)
    {
        var normalizedEmail = NormalizeOptionalValue(email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return;
        }

        var normalizedEmailLower = normalizedEmail.ToLower();
        var exists = await _dbContext.Teachers.AnyAsync(x =>
            x.Email != null &&
            x.Email.ToLower() == normalizedEmailLower &&
            (!existingTeacherId.HasValue || x.Id != existingTeacherId.Value));

        if (exists)
        {
            throw new InvalidOperationException("A teacher with this email already exists.");
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
            PhoneNumber = teacher.PhoneNumber,
            Address = teacher.Address,
            IsActive = teacher.IsActive,
            CreatedAt = teacher.CreatedAt,
            UpdatedAt = teacher.UpdatedAt
        };
    }
}
