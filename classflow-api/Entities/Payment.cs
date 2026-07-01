using ClassFlow.Api.Enums;

namespace ClassFlow.Api.Entities;

public class Payment
{
    public int Id { get; set; }

    public int EnrollmentId { get; set; }

    public Enrollment Enrollment { get; set; } = null!;

    public int StudentId { get; set; }

    public Student Student { get; set; } = null!;

    public int CourseId { get; set; }

    public Course Course { get; set; } = null!;

    public decimal Amount { get; set; }

    public DateTimeOffset? DueDate { get; set; }

    public DateTimeOffset? PaidAt { get; set; }

    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

    public PaymentMethod? Method { get; set; }

    public string? ReferenceNumber { get; set; }

    public string? Notes { get; set; }

    public string? RecordedByUserId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }
}
