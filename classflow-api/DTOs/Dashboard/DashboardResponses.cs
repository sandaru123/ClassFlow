using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.Dashboard;

public class AdminDashboardResponse
{
    public int TotalStudents { get; set; }
    public int TotalTeachers { get; set; }
    public int TotalCourses { get; set; }
    public int TotalActiveEnrollments { get; set; }
    public int TodayClassCount { get; set; }
    public int UpcomingClassCount { get; set; }
    public int PendingPaymentCount { get; set; }
    public decimal TotalPendingAmount { get; set; }
    public decimal TotalPaidAmountThisMonth { get; set; }
    public IReadOnlyList<DashboardPaymentSummary> RecentPayments { get; set; } = [];
    public IReadOnlyList<DashboardClassSummary> UpcomingClasses { get; set; } = [];
}

public class TeacherDashboardResponse
{
    public int MyCourseCount { get; set; }
    public int MyStudentCount { get; set; }
    public int TodayClassCount { get; set; }
    public int UpcomingClassCount { get; set; }
    public IReadOnlyList<DashboardClassSummary> RecentClassSessions { get; set; } = [];
    public IReadOnlyList<DashboardDocumentSummary> RecentUploadedDocuments { get; set; } = [];
}

public class StudentDashboardResponse
{
    public int MyCourseCount { get; set; }
    public int UpcomingClassCount { get; set; }
    public int PendingPaymentCount { get; set; }
    public decimal PendingPaymentAmount { get; set; }
    public DashboardClassSummary? NextClass { get; set; }
    public IReadOnlyList<DashboardDocumentSummary> RecentDocuments { get; set; } = [];
    public DashboardAttendanceSummary AttendanceSummary { get; set; } = new();
}

public class DashboardPaymentSummary
{
    public int PaymentId { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal BalanceAmount { get; set; }
    public PaymentStatus PaymentStatus { get; set; }
    public DateTimeOffset? PaymentDate { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public class DashboardClassSummary
{
    public int ClassSessionId { get; set; }
    public int CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateTimeOffset StartTime { get; set; }
    public DateTimeOffset EndTime { get; set; }
    public ClassSessionStatus Status { get; set; }
    public string TeacherName { get; set; } = string.Empty;
}

public class DashboardDocumentSummary
{
    public int DocumentId { get; set; }
    public int ClassSessionId { get; set; }
    public string ClassSessionTitle { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string? FileType { get; set; }
    public DocumentVisibilityType VisibilityType { get; set; }
    public DateTimeOffset UploadedAt { get; set; }
}

public class DashboardAttendanceSummary
{
    public int TotalClasses { get; set; }
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public int LateCount { get; set; }
    public int ExcusedCount { get; set; }
}
