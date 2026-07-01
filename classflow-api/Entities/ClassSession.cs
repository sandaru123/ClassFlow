using ClassFlow.Api.Enums;

namespace ClassFlow.Api.Entities;

public class ClassSession
{
    public int Id { get; set; }

    public int CourseId { get; set; }

    public Course Course { get; set; } = null!;

    public int TeacherId { get; set; }

    public Teacher Teacher { get; set; } = null!;

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTimeOffset StartDateTime { get; set; }

    public DateTimeOffset EndDateTime { get; set; }

    public ClassMode Mode { get; set; }

    public ClassSessionStatus Status { get; set; } = ClassSessionStatus.Scheduled;

    public string? MeetingUrl { get; set; }

    public string? MeetingPassword { get; set; }

    public string? Notes { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public ICollection<ClassDocument> ClassDocuments { get; set; } = new List<ClassDocument>();

    public ICollection<AttendanceRecord> AttendanceRecords { get; set; } = new List<AttendanceRecord>();
}
