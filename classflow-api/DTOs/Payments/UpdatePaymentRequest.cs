using System.ComponentModel.DataAnnotations;
using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.Payments;

public class UpdatePaymentRequest
{
    [Required]
    public int StudentId { get; set; }

    [Required]
    public int CourseId { get; set; }

    [Required]
    [Range(0.01, 999999999.99)]
    public decimal Amount { get; set; }

    [Range(0, 999999999.99)]
    public decimal PaidAmount { get; set; }

    [Range(1, 12)]
    public int PaymentMonth { get; set; }

    [Range(2000, 9999)]
    public int PaymentYear { get; set; }

    public PaymentMethod? PaymentMethod { get; set; }

    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;

    public DateTimeOffset? PaymentDate { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }

    public bool IsActive { get; set; } = true;
}
