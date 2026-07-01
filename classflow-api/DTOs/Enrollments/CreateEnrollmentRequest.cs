using System.ComponentModel.DataAnnotations;
using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.Enrollments;

public class CreateEnrollmentRequest
{
    [Required]
    public int StudentId { get; set; }

    [Required]
    public int CourseId { get; set; }

    public DateTimeOffset? EnrolledAt { get; set; }

    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Active;
}
