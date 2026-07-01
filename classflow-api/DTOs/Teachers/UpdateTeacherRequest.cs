using System.ComponentModel.DataAnnotations;

namespace ClassFlow.Api.DTOs.Teachers;

public class UpdateTeacherRequest
{
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;

    [EmailAddress]
    [StringLength(256)]
    public string? Email { get; set; }

    [StringLength(50)]
    public string? PhoneNumber { get; set; }

    [StringLength(500)]
    public string? Address { get; set; }

    public bool IsActive { get; set; } = true;
}
