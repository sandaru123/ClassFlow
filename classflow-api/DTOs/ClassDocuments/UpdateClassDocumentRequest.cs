using System.ComponentModel.DataAnnotations;
using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.ClassDocuments;

public class UpdateClassDocumentRequest
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Required]
    public DocumentVisibilityType VisibilityType { get; set; } = DocumentVisibilityType.AvailableImmediately;

    public bool IsActive { get; set; } = true;
}
