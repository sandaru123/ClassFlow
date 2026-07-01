namespace ClassFlow.Api.DTOs.StudentPortal;

public class MyCourseResponse
{
    public int CourseId { get; set; }

    public string CourseName { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal MonthlyFee { get; set; }

    public int TeacherId { get; set; }

    public string TeacherName { get; set; } = string.Empty;

    public DateTimeOffset EnrolledAt { get; set; }
}
