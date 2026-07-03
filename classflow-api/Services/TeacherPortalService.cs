using System.Linq.Expressions;
using ClassFlow.Api.Data;
using ClassFlow.Api.DTOs.TeacherPortal;
using ClassFlow.Api.Entities;
using ClassFlow.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClassFlow.Api.Services;

public class TeacherPortalService : ITeacherPortalService
{
    private readonly AppDbContext _dbContext;

    public TeacherPortalService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<TeacherCourseResponse>> GetMyCoursesAsync(string? applicationUserId)
    {
        var teacher = await ResolveTeacherAsync(applicationUserId);

        return await _dbContext.Courses
            .AsNoTracking()
            .Where(x => x.TeacherId == teacher.Id)
            .OrderBy(x => x.Name)
            .Select(x => new TeacherCourseResponse
            {
                CourseId = x.Id,
                TeacherId = teacher.Id,
                TeacherName = (teacher.FirstName + " " + teacher.LastName).Trim(),
                CourseName = x.Name,
                Description = x.Description,
                MonthlyFee = x.MonthlyFee,
                IsActive = x.IsActive,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<IReadOnlyList<TeacherClassSessionResponse>> GetMyClassSessionsAsync(string? applicationUserId)
    {
        var teacher = await ResolveTeacherAsync(applicationUserId);

        return await _dbContext.ClassSessions
            .AsNoTracking()
            .Where(x => x.TeacherId == teacher.Id)
            .OrderByDescending(x => x.StartDateTime)
            .Select(MapClassSessionResponse())
            .ToListAsync();
    }

    public async Task<IReadOnlyList<TeacherClassSessionResponse>> GetMyUpcomingClassesAsync(string? applicationUserId)
    {
        var teacher = await ResolveTeacherAsync(applicationUserId);
        var now = DateTimeOffset.UtcNow;

        return await _dbContext.ClassSessions
            .AsNoTracking()
            .Where(x => x.TeacherId == teacher.Id && x.StartDateTime >= now)
            .OrderBy(x => x.StartDateTime)
            .Select(MapClassSessionResponse())
            .ToListAsync();
    }

    public async Task<IReadOnlyList<TeacherStudentResponse>> GetMyStudentsAsync(string? applicationUserId)
    {
        var teacher = await ResolveTeacherAsync(applicationUserId);

        return await _dbContext.Enrollments
            .AsNoTracking()
            .Where(x => x.IsActive && x.Course.TeacherId == teacher.Id)
            .OrderBy(x => x.Course.Name)
            .ThenBy(x => x.Student.FirstName)
            .ThenBy(x => x.Student.LastName)
            .Select(x => new TeacherStudentResponse
            {
                StudentId = x.StudentId,
                FirstName = x.Student.FirstName,
                LastName = x.Student.LastName,
                Email = x.Student.Email,
                PhoneNumber = x.Student.PhoneNumber,
                CourseId = x.CourseId,
                CourseName = x.Course.Name,
                EnrolledAt = x.EnrolledAt
            })
            .ToListAsync();
    }

    public async Task<IReadOnlyList<TeacherAttendanceResponse>> GetMyAttendanceRecordsAsync(string? applicationUserId)
    {
        var teacher = await ResolveTeacherAsync(applicationUserId);

        return await _dbContext.AttendanceRecords
            .AsNoTracking()
            .Where(x => x.ClassSession.TeacherId == teacher.Id)
            .OrderByDescending(x => x.MarkedAt)
            .Select(x => new TeacherAttendanceResponse
            {
                AttendanceId = x.Id,
                StudentId = x.StudentId,
                StudentName = (x.Student.FirstName + " " + x.Student.LastName).Trim(),
                ClassSessionId = x.ClassSessionId,
                ClassSessionTitle = x.ClassSession.Title,
                CourseId = x.ClassSession.CourseId,
                CourseName = x.ClassSession.Course.Name,
                Status = x.Status,
                Notes = x.Notes,
                MarkedAt = x.MarkedAt
            })
            .ToListAsync();
    }

    public async Task<IReadOnlyList<TeacherDocumentResponse>> GetMyDocumentsAsync(string? applicationUserId)
    {
        var teacher = await ResolveTeacherAsync(applicationUserId);

        return await _dbContext.ClassDocuments
            .AsNoTracking()
            .Where(x => x.ClassSession.TeacherId == teacher.Id)
            .OrderByDescending(x => x.UploadedAt)
            .Select(x => new TeacherDocumentResponse
            {
                DocumentId = x.Id,
                ClassSessionId = x.ClassSessionId,
                ClassSessionTitle = x.ClassSession.Title,
                CourseId = x.ClassSession.CourseId,
                CourseName = x.ClassSession.Course.Name,
                Title = x.Title,
                Description = x.Description,
                OriginalFileName = x.OriginalFileName,
                FileType = x.FileType,
                FileSizeInBytes = x.FileSizeInBytes,
                VisibilityType = x.VisibilityType,
                IsActive = x.IsActive,
                UploadedAt = x.UploadedAt
            })
            .ToListAsync();
    }

    private async Task<Teacher> ResolveTeacherAsync(string? applicationUserId)
    {
        if (string.IsNullOrWhiteSpace(applicationUserId))
        {
            throw new InvalidOperationException("The logged-in user is not linked to a teacher record.");
        }

        var teacher = await _dbContext.Teachers
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ApplicationUserId == applicationUserId);

        if (teacher is null)
        {
            throw new InvalidOperationException("The logged-in user is not linked to a teacher record.");
        }

        return teacher;
    }

    private static Expression<Func<ClassSession, TeacherClassSessionResponse>> MapClassSessionResponse()
    {
        return x => new TeacherClassSessionResponse
        {
            ClassSessionId = x.Id,
            CourseId = x.CourseId,
            CourseName = x.Course.Name,
            Title = x.Title,
            Description = x.Description,
            StartTime = x.StartDateTime,
            EndTime = x.EndDateTime,
            ClassMode = x.Mode,
            MeetingProvider = x.MeetingProvider,
            MeetingUrl = x.MeetingUrl,
            MeetingPassword = x.MeetingPassword,
            Status = x.Status
        };
    }
}
