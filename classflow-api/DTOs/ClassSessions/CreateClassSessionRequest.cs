using System.ComponentModel.DataAnnotations;
using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.ClassSessions;

public class CreateClassSessionRequest
{
    [Required]
    public int CourseId { get; set; }

    [Required]
    public int TeacherId { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Required]
    public DateTimeOffset StartTime { get; set; }

    [Required]
    public DateTimeOffset EndTime { get; set; }

    [Required]
    public ClassMode ClassMode { get; set; }

    [StringLength(50)]
    public string? MeetingProvider { get; set; }

    [StringLength(1000)]
    public string? MeetingUrl { get; set; }

    [StringLength(100)]
    public string? MeetingPassword { get; set; }

    public ClassSessionStatus Status { get; set; } = ClassSessionStatus.Scheduled;
}
