namespace ClassFlow.Api.Entities;

public class Course
{
    public int Id { get; set; }

    public int TeacherId { get; set; }

    public Teacher Teacher { get; set; } = null!;

    public string Code { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    public decimal MonthlyFee { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }

    public ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();

    public ICollection<ClassSession> ClassSessions { get; set; } = new List<ClassSession>();

    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
