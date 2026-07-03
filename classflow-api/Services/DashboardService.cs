using ClassFlow.Api.Data;
using ClassFlow.Api.DTOs.Dashboard;
using ClassFlow.Api.Entities;
using ClassFlow.Api.Enums;
using ClassFlow.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClassFlow.Api.Services;

public class DashboardService : IDashboardService
{
    private const int SummaryItemLimit = 5;

    private readonly AppDbContext _dbContext;
    private readonly IClassDocumentService _classDocumentService;

    public DashboardService(AppDbContext dbContext, IClassDocumentService classDocumentService)
    {
        _dbContext = dbContext;
        _classDocumentService = classDocumentService;
    }

    public async Task<AdminDashboardResponse> GetAdminDashboardAsync()
    {
        var now = DateTimeOffset.UtcNow;
        var todayStart = now.Date;
        var tomorrowStart = todayStart.AddDays(1);

        var totalStudents = await _dbContext.Students.AsNoTracking().CountAsync(x => x.IsActive);
        var totalTeachers = await _dbContext.Teachers.AsNoTracking().CountAsync(x => x.IsActive);
        var totalCourses = await _dbContext.Courses.AsNoTracking().CountAsync(x => x.IsActive);
        var totalActiveEnrollments = await _dbContext.Enrollments.AsNoTracking().CountAsync(x => x.IsActive);
        var todayClassCount = await _dbContext.ClassSessions.AsNoTracking()
            .CountAsync(x => x.StartDateTime >= todayStart && x.StartDateTime < tomorrowStart && x.Status != ClassSessionStatus.Cancelled);
        var upcomingClassCount = await _dbContext.ClassSessions.AsNoTracking()
            .CountAsync(x => x.StartDateTime > now && x.Status != ClassSessionStatus.Cancelled);

        var pendingPayments = _dbContext.Payments
            .AsNoTracking()
            .Where(x => x.IsActive
                && x.PaymentStatus != PaymentStatus.Cancelled
                && x.BalanceAmount > 0
                && (x.PaymentStatus == PaymentStatus.Pending
                    || x.PaymentStatus == PaymentStatus.PartiallyPaid
                    || x.PaymentStatus == PaymentStatus.Overdue));

        var pendingPaymentCount = await pendingPayments.CountAsync();
        var totalPendingAmount = await pendingPayments.SumAsync(x => (decimal?)x.BalanceAmount) ?? 0m;

        var monthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var nextMonthStart = monthStart.AddMonths(1);
        var totalPaidAmountThisMonth = await _dbContext.Payments
            .AsNoTracking()
            .Where(x => x.IsActive
                && x.PaymentStatus != PaymentStatus.Cancelled
                && ((x.PaymentDate.HasValue && x.PaymentDate.Value >= monthStart && x.PaymentDate.Value < nextMonthStart)
                    || (x.PaidAt.HasValue && x.PaidAt.Value >= monthStart && x.PaidAt.Value < nextMonthStart)))
            .SumAsync(x => (decimal?)x.PaidAmount) ?? 0m;

        var recentPayments = await _dbContext.Payments
            .AsNoTracking()
            .Where(x => x.IsActive)
            .OrderByDescending(x => x.PaymentDate ?? x.PaidAt ?? x.CreatedAt)
            .Take(SummaryItemLimit)
            .Select(x => new DashboardPaymentSummary
            {
                PaymentId = x.Id,
                StudentId = x.StudentId,
                StudentName = (x.Student.FirstName + " " + x.Student.LastName).Trim(),
                CourseId = x.CourseId,
                CourseName = x.Course.Name,
                Amount = x.Amount,
                PaidAmount = x.PaidAmount,
                BalanceAmount = x.BalanceAmount,
                PaymentStatus = x.PaymentStatus,
                PaymentDate = x.PaymentDate ?? x.PaidAt,
                CreatedAt = x.CreatedAt
            })
            .ToListAsync();

        var upcomingClasses = await _dbContext.ClassSessions
            .AsNoTracking()
            .Where(x => x.StartDateTime > now && x.Status != ClassSessionStatus.Cancelled)
            .OrderBy(x => x.StartDateTime)
            .Take(SummaryItemLimit)
            .Select(MapClassSummary())
            .ToListAsync();

        return new AdminDashboardResponse
        {
            TotalStudents = totalStudents,
            TotalTeachers = totalTeachers,
            TotalCourses = totalCourses,
            TotalActiveEnrollments = totalActiveEnrollments,
            TodayClassCount = todayClassCount,
            UpcomingClassCount = upcomingClassCount,
            PendingPaymentCount = pendingPaymentCount,
            TotalPendingAmount = totalPendingAmount,
            TotalPaidAmountThisMonth = totalPaidAmountThisMonth,
            RecentPayments = recentPayments,
            UpcomingClasses = upcomingClasses
        };
    }

    public async Task<TeacherDashboardResponse> GetTeacherDashboardAsync(string? email)
    {
        var teacher = await ResolveTeacherAsync(email);
        var now = DateTimeOffset.UtcNow;
        var todayStart = now.Date;
        var tomorrowStart = todayStart.AddDays(1);

        var myCourseCount = await _dbContext.Courses
            .AsNoTracking()
            .CountAsync(x => x.TeacherId == teacher.Id && x.IsActive);

        var myStudentCount = await _dbContext.Enrollments
            .AsNoTracking()
            .Where(x => x.IsActive && x.Course.TeacherId == teacher.Id)
            .Select(x => x.StudentId)
            .Distinct()
            .CountAsync();

        var todayClassCount = await _dbContext.ClassSessions
            .AsNoTracking()
            .CountAsync(x => x.TeacherId == teacher.Id
                && x.StartDateTime >= todayStart
                && x.StartDateTime < tomorrowStart
                && x.Status != ClassSessionStatus.Cancelled);

        var upcomingClassCount = await _dbContext.ClassSessions
            .AsNoTracking()
            .CountAsync(x => x.TeacherId == teacher.Id
                && x.StartDateTime > now
                && x.Status != ClassSessionStatus.Cancelled);

        var recentClassSessions = await _dbContext.ClassSessions
            .AsNoTracking()
            .Where(x => x.TeacherId == teacher.Id)
            .OrderByDescending(x => x.StartDateTime)
            .Take(SummaryItemLimit)
            .Select(MapClassSummary())
            .ToListAsync();

        var recentUploadedDocuments = await _dbContext.ClassDocuments
            .AsNoTracking()
            .Where(x => x.ClassSession.TeacherId == teacher.Id && x.IsActive)
            .OrderByDescending(x => x.UploadedAt)
            .Take(SummaryItemLimit)
            .Select(x => new DashboardDocumentSummary
            {
                DocumentId = x.Id,
                ClassSessionId = x.ClassSessionId,
                ClassSessionTitle = x.ClassSession.Title,
                CourseId = x.ClassSession.CourseId,
                CourseName = x.ClassSession.Course.Name,
                Title = x.Title,
                OriginalFileName = x.OriginalFileName,
                FileType = x.FileType,
                VisibilityType = x.VisibilityType,
                UploadedAt = x.UploadedAt
            })
            .ToListAsync();

        return new TeacherDashboardResponse
        {
            MyCourseCount = myCourseCount,
            MyStudentCount = myStudentCount,
            TodayClassCount = todayClassCount,
            UpcomingClassCount = upcomingClassCount,
            RecentClassSessions = recentClassSessions,
            RecentUploadedDocuments = recentUploadedDocuments
        };
    }

    public async Task<StudentDashboardResponse> GetStudentDashboardAsync(string? email)
    {
        var student = await ResolveStudentAsync(email);
        var now = DateTimeOffset.UtcNow;
        var courseIds = await GetActiveCourseIdsAsync(student.Id);

        var myCourseCount = courseIds.Count;

        var upcomingClassCount = await _dbContext.ClassSessions
            .AsNoTracking()
            .CountAsync(x => courseIds.Contains(x.CourseId) && x.StartDateTime > now && x.Status != ClassSessionStatus.Cancelled);

        var pendingPayments = _dbContext.Payments
            .AsNoTracking()
            .Where(x => x.StudentId == student.Id
                && x.IsActive
                && x.PaymentStatus != PaymentStatus.Cancelled
                && x.BalanceAmount > 0
                && (x.PaymentStatus == PaymentStatus.Pending
                    || x.PaymentStatus == PaymentStatus.PartiallyPaid
                    || x.PaymentStatus == PaymentStatus.Overdue));

        var pendingPaymentCount = await pendingPayments.CountAsync();
        var pendingPaymentAmount = await pendingPayments.SumAsync(x => (decimal?)x.BalanceAmount) ?? 0m;

        var nextClass = await _dbContext.ClassSessions
            .AsNoTracking()
            .Where(x => courseIds.Contains(x.CourseId) && x.StartDateTime > now && x.Status != ClassSessionStatus.Cancelled)
            .OrderBy(x => x.StartDateTime)
            .Select(MapClassSummary())
            .FirstOrDefaultAsync();

        var candidateDocuments = await _dbContext.ClassDocuments
            .AsNoTracking()
            .Include(x => x.ClassSession)
            .ThenInclude(x => x.Course)
            .Include(x => x.ClassSession)
            .ThenInclude(x => x.Teacher)
            .Where(x => x.IsActive && courseIds.Contains(x.ClassSession.CourseId))
            .OrderByDescending(x => x.UploadedAt)
            .Take(20)
            .ToListAsync();

        var recentDocuments = new List<DashboardDocumentSummary>();
        foreach (var document in candidateDocuments)
        {
            if (!await _classDocumentService.CanStudentAccessDocumentAsync(document.Id, student.Id))
            {
                continue;
            }

            recentDocuments.Add(new DashboardDocumentSummary
            {
                DocumentId = document.Id,
                ClassSessionId = document.ClassSessionId,
                ClassSessionTitle = document.ClassSession.Title,
                CourseId = document.ClassSession.CourseId,
                CourseName = document.ClassSession.Course.Name,
                Title = document.Title,
                OriginalFileName = document.OriginalFileName,
                FileType = document.FileType,
                VisibilityType = document.VisibilityType,
                UploadedAt = document.UploadedAt
            });

            if (recentDocuments.Count == SummaryItemLimit)
            {
                break;
            }
        }

        var attendanceSummary = await _dbContext.AttendanceRecords
            .AsNoTracking()
            .Where(x => x.StudentId == student.Id)
            .GroupBy(_ => 1)
            .Select(g => new DashboardAttendanceSummary
            {
                TotalClasses = g.Count(),
                PresentCount = g.Count(x => x.Status == AttendanceStatus.Present),
                AbsentCount = g.Count(x => x.Status == AttendanceStatus.Absent),
                LateCount = g.Count(x => x.Status == AttendanceStatus.Late),
                ExcusedCount = g.Count(x => x.Status == AttendanceStatus.Excused)
            })
            .FirstOrDefaultAsync() ?? new DashboardAttendanceSummary();

        return new StudentDashboardResponse
        {
            MyCourseCount = myCourseCount,
            UpcomingClassCount = upcomingClassCount,
            PendingPaymentCount = pendingPaymentCount,
            PendingPaymentAmount = pendingPaymentAmount,
            NextClass = nextClass,
            RecentDocuments = recentDocuments,
            AttendanceSummary = attendanceSummary
        };
    }

    private async Task<Student> ResolveStudentAsync(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new InvalidOperationException("The logged-in user is not linked to a student record.");
        }

        var normalizedEmail = email.Trim().ToLower();
        var student = await _dbContext.Students
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Email != null && x.Email.ToLower() == normalizedEmail);

        if (student is null)
        {
            throw new InvalidOperationException("The logged-in user is not linked to a student record.");
        }

        return student;
    }

    private async Task<Teacher> ResolveTeacherAsync(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new InvalidOperationException("The logged-in user is not linked to a teacher record.");
        }

        var normalizedEmail = email.Trim().ToLower();
        var teacher = await _dbContext.Teachers
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Email != null && x.Email.ToLower() == normalizedEmail);

        if (teacher is null)
        {
            throw new InvalidOperationException("The logged-in user is not linked to a teacher record.");
        }

        return teacher;
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

    private static System.Linq.Expressions.Expression<Func<ClassSession, DashboardClassSummary>> MapClassSummary()
    {
        return x => new DashboardClassSummary
        {
            ClassSessionId = x.Id,
            CourseId = x.CourseId,
            CourseName = x.Course.Name,
            Title = x.Title,
            StartTime = x.StartDateTime,
            EndTime = x.EndDateTime,
            Status = x.Status,
            TeacherName = (x.Teacher.FirstName + " " + x.Teacher.LastName).Trim()
        };
    }
}
