using System.ComponentModel.DataAnnotations;
using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.Attendance;

public class UpdateAttendanceRequest
{
    [Required]
    public AttendanceStatus Status { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}
