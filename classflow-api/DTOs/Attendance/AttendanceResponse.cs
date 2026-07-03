using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.Attendance;

public class AttendanceResponse
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    public string StudentName { get; set; } = string.Empty;

    public int ClassSessionId { get; set; }

    public string ClassSessionTitle { get; set; } = string.Empty;

    public AttendanceStatus Status { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset MarkedAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }
}
