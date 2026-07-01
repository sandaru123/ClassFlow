namespace ClassFlow.Api.DTOs.Courses;

public class CourseResponse
{
    public int Id { get; set; }

    public int TeacherId { get; set; }

    public string TeacherName { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal MonthlyFee { get; set; }

    public bool IsActive { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }
}
