using ClassFlow.Api.Data;
using ClassFlow.Api.DTOs.StudentPortal;
using ClassFlow.Api.Entities;
using ClassFlow.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClassFlow.Api.Services;

public class StudentPortalService : IStudentPortalService
{
    private readonly AppDbContext _dbContext;
    private readonly IClassDocumentService _classDocumentService;

    public StudentPortalService(AppDbContext dbContext, IClassDocumentService classDocumentService)
    {
        _dbContext = dbContext;
        _classDocumentService = classDocumentService;
    }

    public async Task<IReadOnlyList<MyCourseResponse>> GetMyCoursesAsync(string? applicationUserId)
    {
        var student = await ResolveStudentAsync(applicationUserId);

        return await _dbContext.Enrollments
            .AsNoTracking()
            .Where(x => x.StudentId == student.Id && x.IsActive)
            .OrderByDescending(x => x.EnrolledAt)
            .Select(x => new MyCourseResponse
            {
                CourseId = x.CourseId,
                CourseName = x.Course.Name,
                Description = x.Course.Description,
                MonthlyFee = x.Course.MonthlyFee,
                TeacherId = x.Course.TeacherId,
                TeacherName = (x.Course.Teacher.FirstName + " " + x.Course.Teacher.LastName).Trim(),
                EnrolledAt = x.EnrolledAt
            })
            .ToListAsync();
    }

    public async Task<IReadOnlyList<MyClassSessionResponse>> GetMyUpcomingClassesAsync(string? applicationUserId)
    {
        var student = await ResolveStudentAsync(applicationUserId);
        var courseIds = await GetActiveCourseIdsAsync(student.Id);
        var now = DateTimeOffset.UtcNow;

        return await _dbContext.ClassSessions
            .AsNoTracking()
            .Where(x => courseIds.Contains(x.CourseId) && x.StartDateTime >= now)
            .OrderBy(x => x.StartDateTime)
            .Select(MapClassSessionResponse())
            .ToListAsync();
    }

    public async Task<IReadOnlyList<MyClassSessionResponse>> GetMyClassSessionsAsync(string? applicationUserId)
    {
        var student = await ResolveStudentAsync(applicationUserId);
        var courseIds = await GetActiveCourseIdsAsync(student.Id);

        return await _dbContext.ClassSessions
            .AsNoTracking()
            .Where(x => courseIds.Contains(x.CourseId))
            .OrderByDescending(x => x.StartDateTime)
            .Select(MapClassSessionResponse())
            .ToListAsync();
    }

    public async Task<IReadOnlyList<MyPaymentResponse>> GetMyPaymentsAsync(string? applicationUserId)
    {
        var student = await ResolveStudentAsync(applicationUserId);

        return await _dbContext.Payments
            .AsNoTracking()
            .Where(x => x.StudentId == student.Id && x.Enrollment.IsActive)
            .OrderByDescending(x => x.PaymentYear)
            .ThenByDescending(x => x.PaymentMonth)
            .Select(x => new MyPaymentResponse
            {
                PaymentId = x.Id,
                CourseId = x.CourseId,
                CourseName = x.Course.Name,
                Amount = x.Amount,
                PaidAmount = x.PaidAmount,
                BalanceAmount = x.BalanceAmount,
                PaymentMonth = x.PaymentMonth,
                PaymentYear = x.PaymentYear,
                PaymentMethod = x.PaymentMethod,
                PaymentStatus = x.PaymentStatus,
                PaymentDate = x.PaymentDate,
                Notes = x.Notes
            })
            .ToListAsync();
    }

    public async Task<IReadOnlyList<MyAttendanceResponse>> GetMyAttendanceAsync(string? applicationUserId)
    {
        var student = await ResolveStudentAsync(applicationUserId);

        return await _dbContext.AttendanceRecords
            .AsNoTracking()
            .Where(x => x.StudentId == student.Id && x.ClassSession.Course.Enrollments.Any(e => e.StudentId == student.Id && e.IsActive))
            .OrderByDescending(x => x.MarkedAt)
            .Select(x => new MyAttendanceResponse
            {
                AttendanceId = x.Id,
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

    public async Task<IReadOnlyList<MyDocumentResponse>> GetMyAvailableDocumentsAsync(string? applicationUserId)
    {
        var student = await ResolveStudentAsync(applicationUserId);
        var courseIds = await GetActiveCourseIdsAsync(student.Id);

        var documents = await _dbContext.ClassDocuments
            .AsNoTracking()
            .Include(x => x.ClassSession)
            .ThenInclude(x => x.Course)
            .Where(x => x.IsActive && courseIds.Contains(x.ClassSession.CourseId))
            .OrderByDescending(x => x.UploadedAt)
            .ToListAsync();

        var results = new List<MyDocumentResponse>();
        foreach (var document in documents)
        {
            var canAccess = await _classDocumentService.CanStudentAccessDocumentAsync(document.Id, student.Id);
            if (!canAccess)
            {
                continue;
            }

            results.Add(new MyDocumentResponse
            {
                DocumentId = document.Id,
                ClassSessionId = document.ClassSessionId,
                ClassSessionTitle = document.ClassSession.Title,
                CourseId = document.ClassSession.CourseId,
                CourseName = document.ClassSession.Course.Name,
                Title = document.Title,
                Description = document.Description,
                OriginalFileName = document.OriginalFileName,
                FileType = document.FileType,
                FileSizeInBytes = document.FileSizeInBytes,
                VisibilityType = document.VisibilityType,
                UploadedAt = document.UploadedAt
            });
        }

        return results;
    }

    private async Task<Student> ResolveStudentAsync(string? applicationUserId)
    {
        if (string.IsNullOrWhiteSpace(applicationUserId))
        {
            throw new InvalidOperationException("The logged-in user is not linked to a student record.");
        }

        var student = await _dbContext.Students
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ApplicationUserId == applicationUserId);

        if (student is null)
        {
            throw new InvalidOperationException("The logged-in user is not linked to a student record.");
        }

        return student;
    }

    private async Task<List<int>> GetActiveCourseIdsAsync(int studentId)
    {
        return await _dbContext.Enrollments
            .AsNoTracking()
            .Where(x => x.StudentId == studentId && x.IsActive)
            .Select(x => x.CourseId)
            .Distinct()
            .ToListAsync();
    }

    private static System.Linq.Expressions.Expression<Func<ClassSession, MyClassSessionResponse>> MapClassSessionResponse()
    {
        return x => new MyClassSessionResponse
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
