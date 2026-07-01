using System.Linq.Expressions;
using ClassFlow.Api.Data;
using ClassFlow.Api.DTOs.Enrollments;
using ClassFlow.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClassFlow.Api.Services;

public class EnrollmentService
{
    private readonly AppDbContext _dbContext;

    public EnrollmentService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<EnrollmentResponse>> GetAllAsync()
    {
        return await _dbContext.Enrollments
            .AsNoTracking()
            .OrderByDescending(x => x.CreatedAt)
            .Select(MapToResponseExpression())
            .ToListAsync();
    }

    public async Task<EnrollmentResponse> GetByIdAsync(int id)
    {
        var enrollment = await _dbContext.Enrollments
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(MapToResponseExpression())
            .SingleOrDefaultAsync();

        if (enrollment is null)
        {
            throw new KeyNotFoundException($"Enrollment with id {id} was not found.");
        }

        return enrollment;
    }

    public async Task<IReadOnlyList<EnrollmentResponse>> GetByStudentIdAsync(int studentId)
    {
        await EnsureStudentExistsAsync(studentId);

        return await _dbContext.Enrollments
            .AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(MapToResponseExpression())
            .ToListAsync();
    }

    public async Task<IReadOnlyList<EnrollmentResponse>> GetByCourseIdAsync(int courseId)
    {
        await EnsureCourseExistsAsync(courseId);

        return await _dbContext.Enrollments
            .AsNoTracking()
            .Where(x => x.CourseId == courseId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(MapToResponseExpression())
            .ToListAsync();
    }

    public async Task<EnrollmentResponse> CreateAsync(CreateEnrollmentRequest request)
    {
        await EnsureStudentExistsAsync(request.StudentId);
        await EnsureCourseExistsAsync(request.CourseId);
        await EnsureNoDuplicateActiveEnrollmentAsync(request.StudentId, request.CourseId);

        var now = DateTimeOffset.UtcNow;
        var enrollment = new Enrollment
        {
            StudentId = request.StudentId,
            CourseId = request.CourseId,
            EnrolledAt = request.EnrolledAt ?? now,
            Status = request.Status,
            IsActive = true,
            CreatedAt = now
        };

        _dbContext.Enrollments.Add(enrollment);
        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(enrollment.Id);
    }

    public async Task<EnrollmentResponse> UpdateAsync(int id, UpdateEnrollmentRequest request)
    {
        var enrollment = await _dbContext.Enrollments.SingleOrDefaultAsync(x => x.Id == id);
        if (enrollment is null)
        {
            throw new KeyNotFoundException($"Enrollment with id {id} was not found.");
        }

        await EnsureStudentExistsAsync(request.StudentId);
        await EnsureCourseExistsAsync(request.CourseId);

        if (request.IsActive)
        {
            await EnsureNoDuplicateActiveEnrollmentAsync(request.StudentId, request.CourseId, id);
        }

        enrollment.StudentId = request.StudentId;
        enrollment.CourseId = request.CourseId;
        enrollment.EnrolledAt = request.EnrolledAt;
        enrollment.Status = request.Status;
        enrollment.IsActive = request.IsActive;
        enrollment.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task DeactivateAsync(int id)
    {
        var enrollment = await _dbContext.Enrollments.SingleOrDefaultAsync(x => x.Id == id);
        if (enrollment is null)
        {
            throw new KeyNotFoundException($"Enrollment with id {id} was not found.");
        }

        if (!enrollment.IsActive)
        {
            return;
        }

        enrollment.IsActive = false;
        enrollment.UpdatedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync();
    }

    private async Task EnsureStudentExistsAsync(int studentId)
    {
        var exists = await _dbContext.Students.AnyAsync(x => x.Id == studentId);
        if (!exists)
        {
            throw new InvalidOperationException($"Student with id {studentId} was not found.");
        }
    }

    private async Task EnsureCourseExistsAsync(int courseId)
    {
        var exists = await _dbContext.Courses.AnyAsync(x => x.Id == courseId);
        if (!exists)
        {
            throw new InvalidOperationException($"Course with id {courseId} was not found.");
        }
    }

    private async Task EnsureNoDuplicateActiveEnrollmentAsync(int studentId, int courseId, int? currentEnrollmentId = null)
    {
        var exists = await _dbContext.Enrollments.AnyAsync(x =>
            x.StudentId == studentId &&
            x.CourseId == courseId &&
            x.IsActive &&
            (!currentEnrollmentId.HasValue || x.Id != currentEnrollmentId.Value));

        if (exists)
        {
            throw new InvalidOperationException("An active enrollment already exists for this student and course.");
        }
    }

    private static Expression<Func<Enrollment, EnrollmentResponse>> MapToResponseExpression()
    {
        return enrollment => new EnrollmentResponse
        {
            Id = enrollment.Id,
            StudentId = enrollment.StudentId,
            StudentName = (enrollment.Student.FirstName + " " + enrollment.Student.LastName).Trim(),
            CourseId = enrollment.CourseId,
            CourseName = enrollment.Course.Name,
            EnrolledAt = enrollment.EnrolledAt,
            Status = enrollment.Status,
            IsActive = enrollment.IsActive,
            CreatedAt = enrollment.CreatedAt,
            UpdatedAt = enrollment.UpdatedAt
        };
    }
}
