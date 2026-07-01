using ClassFlow.Api.Enums;

namespace ClassFlow.Api.Entities;

public class ClassDocument
{
    public int Id { get; set; }

    public int ClassSessionId { get; set; }

    public ClassSession ClassSession { get; set; } = null!;

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string OriginalFileName { get; set; } = string.Empty;

    public string StoredFileName { get; set; } = string.Empty;

    public string StoragePath { get; set; } = string.Empty;

    public string? FileType { get; set; }

    public long FileSizeInBytes { get; set; }

    public DocumentVisibilityType VisibilityType { get; set; } = DocumentVisibilityType.AvailableImmediately;

    public bool IsActive { get; set; } = true;

    public string? UploadedByUserId { get; set; }

    public DateTimeOffset UploadedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }
}
