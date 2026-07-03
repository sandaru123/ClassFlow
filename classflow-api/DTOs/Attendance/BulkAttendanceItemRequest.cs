using System.ComponentModel.DataAnnotations;
using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.Attendance;

public class BulkAttendanceItemRequest
{
    [Required]
    public int StudentId { get; set; }

    [Required]
    public AttendanceStatus Status { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}
