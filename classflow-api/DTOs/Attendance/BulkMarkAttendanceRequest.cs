using System.ComponentModel.DataAnnotations;

namespace ClassFlow.Api.DTOs.Attendance;

public class BulkMarkAttendanceRequest
{
    [Required]
    public int ClassSessionId { get; set; }

    [Required]
    [MinLength(1)]
    public IReadOnlyList<BulkAttendanceItemRequest> Items { get; set; } = Array.Empty<BulkAttendanceItemRequest>();
}
