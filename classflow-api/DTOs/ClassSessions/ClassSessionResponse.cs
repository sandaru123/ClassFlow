using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.ClassSessions;

public class ClassSessionResponse
{
    public int Id { get; set; }

    public int CourseId { get; set; }

    public string CourseName { get; set; } = string.Empty;

    public int TeacherId { get; set; }

    public string TeacherName { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public DateTimeOffset StartTime { get; set; }

    public DateTimeOffset EndTime { get; set; }

    public ClassMode ClassMode { get; set; }

    public string? MeetingProvider { get; set; }

    public string? MeetingUrl { get; set; }

    public string? MeetingPassword { get; set; }

    public ClassSessionStatus Status { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }
}
