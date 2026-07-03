using System.ComponentModel.DataAnnotations;
using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.Payments;

public class RecordPaymentRequest
{
    [Required]
    [Range(0.01, 999999999.99)]
    public decimal Amount { get; set; }

    public PaymentMethod? PaymentMethod { get; set; }

    public DateTimeOffset? PaymentDate { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}
