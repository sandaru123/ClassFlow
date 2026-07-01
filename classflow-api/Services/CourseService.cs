using System.Linq.Expressions;
using ClassFlow.Api.Data;
using ClassFlow.Api.DTOs.Courses;
using ClassFlow.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClassFlow.Api.Services;

public class CourseService
{
    private readonly AppDbContext _dbContext;

    public CourseService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<CourseResponse>> GetAllAsync()
    {
        return await _dbContext.Courses
            .AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(MapToResponseExpression())
            .ToListAsync();
    }

    public async Task<CourseResponse> GetByIdAsync(int id)
    {
        var course = await _dbContext.Courses
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(MapToResponseExpression())
            .SingleOrDefaultAsync();

        if (course is null)
        {
            throw new KeyNotFoundException($"Course with id {id} was not found.");
        }

        return course;
    }

    public async Task<CourseResponse> CreateAsync(CreateCourseRequest request)
    {
        await EnsureTeacherExistsAsync(request.TeacherId);

        var course = new Course
        {
            TeacherId = request.TeacherId,
            Name = request.Name.Trim(),
            Description = NormalizeOptionalValue(request.Description),
            MonthlyFee = request.MonthlyFee,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.Courses.Add(course);
        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(course.Id);
    }

    public async Task<CourseResponse> UpdateAsync(int id, UpdateCourseRequest request)
    {
        var course = await _dbContext.Courses.SingleOrDefaultAsync(x => x.Id == id);
        if (course is null)
        {
            throw new KeyNotFoundException($"Course with id {id} was not found.");
        }

        await EnsureTeacherExistsAsync(request.TeacherId);

        course.TeacherId = request.TeacherId;
        course.Name = request.Name.Trim();
        course.Description = NormalizeOptionalValue(request.Description);
        course.MonthlyFee = request.MonthlyFee;
        course.IsActive = request.IsActive;
        course.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(course.Id);
    }

    public async Task DeactivateAsync(int id)
    {
        var course = await _dbContext.Courses.SingleOrDefaultAsync(x => x.Id == id);
        if (course is null)
        {
            throw new KeyNotFoundException($"Course with id {id} was not found.");
        }

        if (!course.IsActive)
        {
            return;
        }

        course.IsActive = false;
        course.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync();
    }

    private async Task EnsureTeacherExistsAsync(int teacherId)
    {
        var exists = await _dbContext.Teachers.AnyAsync(x => x.Id == teacherId);
        if (!exists)
        {
            throw new InvalidOperationException($"Teacher with id {teacherId} was not found.");
        }
    }

    private static string? NormalizeOptionalValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static Expression<Func<Course, CourseResponse>> MapToResponseExpression()
    {
        return course => new CourseResponse
        {
            Id = course.Id,
            TeacherId = course.TeacherId,
            TeacherName = (course.Teacher.FirstName + " " + course.Teacher.LastName).Trim(),
            Name = course.Name,
            Description = course.Description,
            MonthlyFee = course.MonthlyFee,
            IsActive = course.IsActive,
            CreatedAt = course.CreatedAt,
            UpdatedAt = course.UpdatedAt
        };
    }
}
