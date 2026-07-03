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

    public decimal PaidAmount { get; set; }

    public decimal BalanceAmount { get; set; }

    public int PaymentMonth { get; set; }

    public int PaymentYear { get; set; }

    public DateTimeOffset? DueDate { get; set; }

    public DateTimeOffset? PaidAt { get; set; }

    public DateTimeOffset? PaymentDate { get; set; }

    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

    public PaymentMethod? PaymentMethod { get; set; }

    public PaymentStatus Status
    {
        get => PaymentStatus;
        set => PaymentStatus = value;
    }

    public PaymentMethod? Method
    {
        get => PaymentMethod;
        set => PaymentMethod = value;
    }

    public bool IsActive { get; set; } = true;

    public string? ReferenceNumber { get; set; }

    public string? Notes { get; set; }

    public string? RecordedByUserId { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }
}
