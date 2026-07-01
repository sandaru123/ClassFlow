using ClassFlow.Api.Enums;

namespace ClassFlow.Api.DTOs.StudentPortal;

public class MyDocumentResponse
{
    public int DocumentId { get; set; }

    public int ClassSessionId { get; set; }

    public string ClassSessionTitle { get; set; } = string.Empty;

    public int CourseId { get; set; }

    public string CourseName { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string OriginalFileName { get; set; } = string.Empty;

    public string? FileType { get; set; }

    public long FileSizeInBytes { get; set; }

    public DocumentVisibilityType VisibilityType { get; set; }

    public DateTimeOffset UploadedAt { get; set; }
}
