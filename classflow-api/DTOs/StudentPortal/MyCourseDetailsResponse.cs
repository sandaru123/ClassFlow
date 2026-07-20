using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.StudentPortal;

public class MyCourseDetailsResponse
{
    public int CourseId { get; set; }

    public string CourseName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal MonthlyFee { get; set; }

    public int TeacherId { get; set; }

    public string TeacherName { get; set; } = string.Empty;

    public string? TeacherEmail { get; set; }

    public string? TeacherPhoneNumber { get; set; }

    public DateTimeOffset EnrolledAt { get; set; }

    public EnrollmentStatus EnrollmentStatus { get; set; }

    public IReadOnlyList<MyCourseSessionDetailsResponse> Sessions { get; set; } = [];
}

public class MyCourseSessionDetailsResponse
{
    public int ClassSessionId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTimeOffset StartTime { get; set; }

    public DateTimeOffset EndTime { get; set; }

    public ClassMode ClassMode { get; set; }

    public ClassSessionStatus Status { get; set; }

    public string? MeetingProvider { get; set; }

    public string? MeetingUrl { get; set; }

    public IReadOnlyList<MyCourseSessionDocumentResponse> Documents { get; set; } = [];
}

public class MyCourseSessionDocumentResponse
{
    public int DocumentId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string OriginalFileName { get; set; } = string.Empty;

    public string? FileType { get; set; }

    public long FileSizeInBytes { get; set; }

    public DocumentVisibilityType VisibilityType { get; set; }

    public DateTimeOffset UploadedAt { get; set; }

    public bool IsAvailable { get; set; }

    public string AvailabilityMessage { get; set; } = string.Empty;
}
