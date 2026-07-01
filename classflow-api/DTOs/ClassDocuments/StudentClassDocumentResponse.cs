using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.ClassDocuments;

public class StudentClassDocumentResponse
{
    public int Id { get; set; }

    public int ClassSessionId { get; set; }

    public string ClassSessionTitle { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string OriginalFileName { get; set; } = string.Empty;

    public string? FileType { get; set; }

    public long FileSizeInBytes { get; set; }

    public DocumentVisibilityType VisibilityType { get; set; }

    public DateTimeOffset UploadedAt { get; set; }
}
