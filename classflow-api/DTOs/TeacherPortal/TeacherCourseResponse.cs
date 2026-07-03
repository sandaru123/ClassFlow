namespace ClassFlow.Api.DTOs.TeacherPortal;

public class TeacherCourseResponse
{
    public int CourseId { get; set; }

    public int TeacherId { get; set; }

    public string TeacherName { get; set; } = string.Empty;

    public string CourseName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal MonthlyFee { get; set; }

    public bool IsActive { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}
