using ClassFlow.Api.Enums;

namespace ClassFlow.Api.Entities;

public class AttendanceRecord
{
    public int Id { get; set; }

    public int ClassSessionId { get; set; }

    public ClassSession ClassSession { get; set; } = null!;

    public int StudentId { get; set; }

    public Student Student { get; set; } = null!;

    public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;

    public DateTimeOffset MarkedAt { get; set; }

    public string? Notes { get; set; }

    public string? MarkedByUserId { get; set; }
}
