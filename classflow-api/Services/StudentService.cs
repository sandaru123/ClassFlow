using ClassFlow.Api.Data;
using ClassFlow.Api.DTOs.Students;
using ClassFlow.Api.Entities;
using ClassFlow.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClassFlow.Api.Services;

public class StudentService : IStudentService
{
    private readonly AppDbContext _dbContext;

    public StudentService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
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
        await EnsureEmailIsUniqueAsync(request.Email);

        var student = new Student
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = NormalizeOptionalValue(request.Email),
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

    public async Task<StudentResponse> UpdateAsync(int id, UpdateStudentRequest request)
    {
        var student = await _dbContext.Students.SingleOrDefaultAsync(x => x.Id == id);
        if (student is null)
        {
            throw new KeyNotFoundException($"Student with id {id} was not found.");
        }

        await EnsureEmailIsUniqueAsync(request.Email, id);

        student.FirstName = request.FirstName.Trim();
        student.LastName = request.LastName.Trim();
        student.Email = NormalizeOptionalValue(request.Email);
        student.PhoneNumber = NormalizeOptionalValue(request.PhoneNumber);
        student.Address = NormalizeOptionalValue(request.Address);
        student.DateOfBirth = request.DateOfBirth;
        student.IsActive = request.IsActive;
        student.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync();

        return MapToResponse(student);
    }

    public async Task DeactivateAsync(int id)
    {
        var student = await _dbContext.Students.SingleOrDefaultAsync(x => x.Id == id);
        if (student is null)
        {
            throw new KeyNotFoundException($"Student with id {id} was not found.");
        }

        if (!student.IsActive)
        {
            return;
        }

        student.IsActive = false;
        student.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync();
    }

    private async Task EnsureEmailIsUniqueAsync(string? email, int? existingStudentId = null)
    {
        var normalizedEmail = NormalizeOptionalValue(email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return;
        }

        var exists = await _dbContext.Students.AnyAsync(x =>
            x.Email != null &&
            x.Email.ToLower() == normalizedEmail.ToLower() &&
            (!existingStudentId.HasValue || x.Id != existingStudentId.Value));

        if (exists)
        {
            throw new InvalidOperationException("A student with this email already exists.");
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
            IsActive = student.IsActive,
            CreatedAt = student.CreatedAt,
            UpdatedAt = student.UpdatedAt
        };
    }
}

