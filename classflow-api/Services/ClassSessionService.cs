using System.Linq.Expressions;
using ClassFlow.Api.Data;
using ClassFlow.Api.DTOs.ClassSessions;
using ClassFlow.Api.Entities;
using ClassFlow.Api.Interfaces;
using ClassFlow.Api.Enums;
using Microsoft.EntityFrameworkCore;

namespace ClassFlow.Api.Services;

public class ClassSessionService : IClassSessionService
{
    private readonly AppDbContext _dbContext;

    public ClassSessionService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ClassSessionResponse>> GetAllAsync()
    {
        return await _dbContext.ClassSessions
            .AsNoTracking()
            .OrderBy(x => x.StartDateTime)
            .Select(MapToResponseExpression())
            .ToListAsync();
    }

    public async Task<ClassSessionResponse> GetByIdAsync(int id)
    {
        var classSession = await _dbContext.ClassSessions
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(MapToResponseExpression())
            .SingleOrDefaultAsync();

        if (classSession is null)
        {
            throw new KeyNotFoundException($"Class session with id {id} was not found.");
        }

        return classSession;
    }

    public async Task<IReadOnlyList<ClassSessionResponse>> GetByCourseIdAsync(int courseId)
    {
        await EnsureCourseExistsAsync(courseId);

        return await _dbContext.ClassSessions
            .AsNoTracking()
            .Where(x => x.CourseId == courseId)
            .OrderBy(x => x.StartDateTime)
            .Select(MapToResponseExpression())
            .ToListAsync();
    }

    public async Task<IReadOnlyList<ClassSessionResponse>> GetUpcomingAsync()
    {
        var now = DateTimeOffset.UtcNow;

        return await _dbContext.ClassSessions
            .AsNoTracking()
            .Where(x => x.StartDateTime >= now && x.Status != ClassSessionStatus.Cancelled)
            .OrderBy(x => x.StartDateTime)
            .Select(MapToResponseExpression())
            .ToListAsync();
    }

    public async Task<ClassSessionResponse> CreateAsync(CreateClassSessionRequest request)
    {
        ValidateTimeRange(request.StartTime, request.EndTime);
        await EnsureCourseExistsAsync(request.CourseId);
        await EnsureTeacherExistsAsync(request.TeacherId);

        var classSession = new ClassSession
        {
            CourseId = request.CourseId,
            TeacherId = request.TeacherId,
            Title = request.Title.Trim(),
            Description = NormalizeOptionalValue(request.Description),
            StartDateTime = request.StartTime,
            EndDateTime = request.EndTime,
            Mode = request.ClassMode,
            MeetingProvider = NormalizeOptionalValue(request.MeetingProvider),
            MeetingUrl = NormalizeOptionalValue(request.MeetingUrl),
            MeetingPassword = NormalizeOptionalValue(request.MeetingPassword),
            Status = request.Status,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.ClassSessions.Add(classSession);
        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(classSession.Id);
    }

    public async Task<ClassSessionResponse> UpdateAsync(int id, UpdateClassSessionRequest request)
    {
        ValidateTimeRange(request.StartTime, request.EndTime);

        var classSession = await _dbContext.ClassSessions.SingleOrDefaultAsync(x => x.Id == id);
        if (classSession is null)
        {
            throw new KeyNotFoundException($"Class session with id {id} was not found.");
        }

        await EnsureCourseExistsAsync(request.CourseId);
        await EnsureTeacherExistsAsync(request.TeacherId);

        classSession.CourseId = request.CourseId;
        classSession.TeacherId = request.TeacherId;
        classSession.Title = request.Title.Trim();
        classSession.Description = NormalizeOptionalValue(request.Description);
        classSession.StartDateTime = request.StartTime;
        classSession.EndDateTime = request.EndTime;
        classSession.Mode = request.ClassMode;
        classSession.MeetingProvider = NormalizeOptionalValue(request.MeetingProvider);
        classSession.MeetingUrl = NormalizeOptionalValue(request.MeetingUrl);
        classSession.MeetingPassword = NormalizeOptionalValue(request.MeetingPassword);
        classSession.Status = request.Status;
        classSession.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<ClassSessionResponse> CancelAsync(int id)
    {
        var classSession = await _dbContext.ClassSessions.SingleOrDefaultAsync(x => x.Id == id);
        if (classSession is null)
        {
            throw new KeyNotFoundException($"Class session with id {id} was not found.");
        }

        if (classSession.Status == ClassSessionStatus.Completed)
        {
            throw new InvalidOperationException("Completed class sessions cannot be cancelled.");
        }

        if (classSession.Status != ClassSessionStatus.Cancelled)
        {
            classSession.Status = ClassSessionStatus.Cancelled;
            classSession.UpdatedAt = DateTimeOffset.UtcNow;
            await _dbContext.SaveChangesAsync();
        }

        return await GetByIdAsync(id);
    }

    public async Task<ClassSessionResponse> MarkCompletedAsync(int id)
    {
        var classSession = await _dbContext.ClassSessions.SingleOrDefaultAsync(x => x.Id == id);
        if (classSession is null)
        {
            throw new KeyNotFoundException($"Class session with id {id} was not found.");
        }

        if (classSession.Status == ClassSessionStatus.Cancelled)
        {
            throw new InvalidOperationException("Cancelled class sessions cannot be marked as completed.");
        }

        if (classSession.Status != ClassSessionStatus.Completed)
        {
            classSession.Status = ClassSessionStatus.Completed;
            classSession.UpdatedAt = DateTimeOffset.UtcNow;
            await _dbContext.SaveChangesAsync();
        }

        return await GetByIdAsync(id);
    }

    private async Task EnsureCourseExistsAsync(int courseId)
    {
        var exists = await _dbContext.Courses.AnyAsync(x => x.Id == courseId);
        if (!exists)
        {
            throw new InvalidOperationException($"Course with id {courseId} was not found.");
        }
    }

    private async Task EnsureTeacherExistsAsync(int teacherId)
    {
        var exists = await _dbContext.Teachers.AnyAsync(x => x.Id == teacherId);
        if (!exists)
        {
            throw new InvalidOperationException($"Teacher with id {teacherId} was not found.");
        }
    }

    private static void ValidateTimeRange(DateTimeOffset startTime, DateTimeOffset endTime)
    {
        if (endTime <= startTime)
        {
            throw new InvalidOperationException("EndTime must be after StartTime.");
        }
    }

    private static string? NormalizeOptionalValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static Expression<Func<ClassSession, ClassSessionResponse>> MapToResponseExpression()
    {
        return classSession => new ClassSessionResponse
        {
            Id = classSession.Id,
            CourseId = classSession.CourseId,
            CourseName = classSession.Course.Name,
            TeacherId = classSession.TeacherId,
            TeacherName = (classSession.Teacher.FirstName + " " + classSession.Teacher.LastName).Trim(),
            Title = classSession.Title,
            Description = classSession.Description,
            StartTime = classSession.StartDateTime,
            EndTime = classSession.EndDateTime,
            ClassMode = classSession.Mode,
            MeetingProvider = classSession.MeetingProvider,
            MeetingUrl = classSession.MeetingUrl,
            MeetingPassword = classSession.MeetingPassword,
            Status = classSession.Status,
            CreatedAt = classSession.CreatedAt,
            UpdatedAt = classSession.UpdatedAt
        };
    }
}

