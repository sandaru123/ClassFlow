using System.ComponentModel.DataAnnotations;
using ClassFlow.Api.Enums;
using Microsoft.AspNetCore.Http;

namespace ClassFlow.Api.DTOs.ClassDocuments;

public class UploadClassDocumentRequest
{
    [Required]
    public int ClassSessionId { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;

    [StringLength(1000)]
    public string? Description { get; set; }

    [Required]
    public IFormFile File { get; set; } = null!;

    [Required]
    public DocumentVisibilityType VisibilityType { get; set; } = DocumentVisibilityType.AvailableImmediately;
}
