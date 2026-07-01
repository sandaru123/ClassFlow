namespace ClassFlow.Api.DTOs.TeacherPortal;

public class TeacherStudentResponse
{
    public int StudentId { get; set; }

    public string FirstName { get; set; } = string.Empty;

    public string LastName { get; set; } = string.Empty;

    public string? Email { get; set; }

    public string? PhoneNumber { get; set; }

    public int CourseId { get; set; }

    public string CourseName { get; set; } = string.Empty;

    public DateTimeOffset EnrolledAt { get; set; }
}
