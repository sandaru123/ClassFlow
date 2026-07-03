using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.TeacherPortal;

public class TeacherAttendanceResponse
{
    public int AttendanceId { get; set; }

    public int StudentId { get; set; }

    public string StudentName { get; set; } = string.Empty;

    public int ClassSessionId { get; set; }

    public string ClassSessionTitle { get; set; } = string.Empty;

    public int CourseId { get; set; }

    public string CourseName { get; set; } = string.Empty;

    public AttendanceStatus Status { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset MarkedAt { get; set; }
}
