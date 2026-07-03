using ClassFlow.Api.Services;
using ClassFlow.Api.DTOs.ClassDocuments;

namespace ClassFlow.Api.Interfaces;

public interface IClassDocumentService
{
    Task<IReadOnlyList<ClassDocumentResponse>> GetAllAsync();

    Task<ClassDocumentResponse> GetByIdAsync(int id);

    Task<IReadOnlyList<ClassDocumentResponse>> GetByClassSessionIdAsync(int classSessionId);

    Task<IReadOnlyList<StudentClassDocumentResponse>> GetAvailableForStudentAsync(int classSessionId, int studentId);

    Task<ClassDocumentResponse> UploadAsync(UploadClassDocumentRequest request, string? uploadedByUserId);

    Task<ClassDocumentResponse> UpdateAsync(int id, UpdateClassDocumentRequest request);

    Task DeactivateAsync(int id);

    Task ReactivateAsync(int id);

    Task DeleteForeverAsync(int id);

    Task<DocumentDownloadResult> DownloadAsync(int documentId, string? applicationUserId, bool isAdmin);

    Task<bool> CanStudentAccessDocumentAsync(int documentId, int studentId);
}

