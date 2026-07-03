using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.StudentPortal;

public class MyPaymentResponse
{
    public int PaymentId { get; set; }

    public int CourseId { get; set; }

    public string CourseName { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public decimal PaidAmount { get; set; }

    public decimal BalanceAmount { get; set; }

    public int PaymentMonth { get; set; }

    public int PaymentYear { get; set; }

    public PaymentMethod? PaymentMethod { get; set; }

    public PaymentStatus PaymentStatus { get; set; }

    public DateTimeOffset? PaymentDate { get; set; }

    public string? Notes { get; set; }
}
