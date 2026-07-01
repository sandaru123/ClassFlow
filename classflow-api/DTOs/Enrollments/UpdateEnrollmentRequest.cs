using System.ComponentModel.DataAnnotations;
using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.Enrollments;

public class UpdateEnrollmentRequest
{
    [Required]
    public int StudentId { get; set; }

    [Required]
    public int CourseId { get; set; }

    [Required]
    public DateTimeOffset EnrolledAt { get; set; }

    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Active;

    public bool IsActive { get; set; } = true;
}
