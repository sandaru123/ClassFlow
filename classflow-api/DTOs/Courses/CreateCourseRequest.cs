using System.ComponentModel.DataAnnotations;

namespace ClassFlow.Api.DTOs.Courses;

public class CreateCourseRequest
{
    [Required]
    public int TeacherId { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Range(0, 999999999.99)]
    public decimal MonthlyFee { get; set; }
}
