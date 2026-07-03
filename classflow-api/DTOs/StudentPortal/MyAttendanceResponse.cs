using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.StudentPortal;

public class MyAttendanceResponse
{
    public int AttendanceId { get; set; }

    public int ClassSessionId { get; set; }

    public string ClassSessionTitle { get; set; } = string.Empty;

    public int CourseId { get; set; }

    public string CourseName { get; set; } = string.Empty;

    public AttendanceStatus Status { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset MarkedAt { get; set; }
}
