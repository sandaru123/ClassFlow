using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.Enrollments;

public class EnrollmentResponse
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    public string StudentName { get; set; } = string.Empty;

    public int CourseId { get; set; }

    public string CourseName { get; set; } = string.Empty;

    public DateTimeOffset EnrolledAt { get; set; }

    public EnrollmentStatus Status { get; set; }

    public bool IsActive { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }
}
