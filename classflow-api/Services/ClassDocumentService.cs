using System.Linq.Expressions;
using ClassFlow.Api.Data;
using ClassFlow.Api.DTOs.ClassDocuments;
using ClassFlow.Api.Entities;
using ClassFlow.Api.Enums;
using ClassFlow.Api.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace ClassFlow.Api.Services;

public class ClassDocumentService : IClassDocumentService
{
    private readonly AppDbContext _dbContext;
    private readonly IWebHostEnvironment _environment;

    public ClassDocumentService(AppDbContext dbContext, IWebHostEnvironment environment)
    {
        _dbContext = dbContext;
        _environment = environment;
    }

    public async Task<IReadOnlyList<ClassDocumentResponse>> GetAllAsync()
    {
        return await _dbContext.ClassDocuments
            .AsNoTracking()
            .OrderByDescending(x => x.UploadedAt)
            .Select(MapToAdminResponseExpression())
            .ToListAsync();
    }

    public async Task<ClassDocumentResponse> GetByIdAsync(int id)
    {
        var document = await _dbContext.ClassDocuments
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(MapToAdminResponseExpression())
            .SingleOrDefaultAsync();

        if (document is null)
        {
            throw new KeyNotFoundException($"Class document with id {id} was not found.");
        }

        return document;
    }

    public async Task<IReadOnlyList<ClassDocumentResponse>> GetByClassSessionIdAsync(int classSessionId)
    {
        await EnsureClassSessionExistsAsync(classSessionId);

        return await _dbContext.ClassDocuments
            .AsNoTracking()
            .Where(x => x.ClassSessionId == classSessionId)
            .OrderByDescending(x => x.UploadedAt)
            .Select(MapToAdminResponseExpression())
            .ToListAsync();
    }

    public async Task<IReadOnlyList<StudentClassDocumentResponse>> GetAvailableForStudentAsync(int classSessionId, int studentId)
    {
        await EnsureStudentEnrolledForClassSessionAsync(studentId, classSessionId);

        var now = DateTimeOffset.UtcNow;
        var documents = await _dbContext.ClassDocuments
            .AsNoTracking()
            .Include(x => x.ClassSession)
            .Where(x => x.ClassSessionId == classSessionId && x.IsActive)
            .OrderByDescending(x => x.UploadedAt)
            .ToListAsync();

        return documents
            .Where(x => IsStudentAccessAllowed(x, now))
            .Select(MapToStudentResponse)
            .ToList();
    }

    public async Task<ClassDocumentResponse> UploadAsync(UploadClassDocumentRequest request, string? uploadedByUserId)
    {
        await EnsureClassSessionExistsAsync(request.ClassSessionId);
        ValidateFile(request.File);

        var uploadsRoot = GetUploadsRoot();
        Directory.CreateDirectory(uploadsRoot);

        var storedFileName = $"{Guid.NewGuid():N}{Path.GetExtension(request.File.FileName)}";
        var fullPath = Path.Combine(uploadsRoot, storedFileName);

        await using (var stream = new FileStream(fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await request.File.CopyToAsync(stream);
        }

        var document = new ClassDocument
        {
            ClassSessionId = request.ClassSessionId,
            Title = request.Title.Trim(),
            Description = NormalizeOptionalValue(request.Description),
            OriginalFileName = Path.GetFileName(request.File.FileName),
            StoredFileName = storedFileName,
            StoragePath = fullPath,
            FileType = NormalizeOptionalValue(request.File.ContentType) ?? "application/octet-stream",
            FileSizeInBytes = request.File.Length,
            VisibilityType = request.VisibilityType,
            IsActive = true,
            UploadedByUserId = NormalizeOptionalValue(uploadedByUserId),
            UploadedAt = DateTimeOffset.UtcNow
        };

        _dbContext.ClassDocuments.Add(document);
        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(document.Id);
    }

    public async Task<ClassDocumentResponse> UpdateAsync(int id, UpdateClassDocumentRequest request)
    {
        var document = await _dbContext.ClassDocuments.SingleOrDefaultAsync(x => x.Id == id);
        if (document is null)
        {
            throw new KeyNotFoundException($"Class document with id {id} was not found.");
        }

        document.Title = request.Title.Trim();
        document.Description = NormalizeOptionalValue(request.Description);
        document.VisibilityType = request.VisibilityType;
        document.IsActive = request.IsActive;
        document.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task DeactivateAsync(int id)
    {
        var document = await _dbContext.ClassDocuments.SingleOrDefaultAsync(x => x.Id == id);
        if (document is null)
        {
            throw new KeyNotFoundException($"Class document with id {id} was not found.");
        }

        if (!document.IsActive)
        {
            return;
        }

        document.IsActive = false;
        document.UpdatedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync();
    }

    public async Task<DocumentDownloadResult> DownloadAsync(int documentId)
    {
        var document = await _dbContext.ClassDocuments
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == documentId);

        if (document is null)
        {
            throw new KeyNotFoundException($"Class document with id {documentId} was not found.");
        }

        if (string.IsNullOrWhiteSpace(document.StoragePath) || !File.Exists(document.StoragePath))
        {
            throw new FileNotFoundException("The requested document file does not exist.");
        }

        var stream = new FileStream(document.StoragePath, FileMode.Open, FileAccess.Read, FileShare.Read);

        return new DocumentDownloadResult
        {
            Content = stream,
            ContentType = string.IsNullOrWhiteSpace(document.FileType) ? "application/octet-stream" : document.FileType,
            FileName = document.OriginalFileName
        };
    }

    public async Task<bool> CanStudentAccessDocumentAsync(int documentId, int studentId)
    {
        var document = await _dbContext.ClassDocuments
            .AsNoTracking()
            .Include(x => x.ClassSession)
            .SingleOrDefaultAsync(x => x.Id == documentId);

        if (document is null || !document.IsActive)
        {
            return false;
        }

        var isEnrolled = await _dbContext.Enrollments.AnyAsync(x =>
            x.StudentId == studentId &&
            x.CourseId == document.ClassSession.CourseId &&
            x.IsActive);

        if (!isEnrolled)
        {
            return false;
        }

        return IsStudentAccessAllowed(document, DateTimeOffset.UtcNow);
    }

    private async Task EnsureClassSessionExistsAsync(int classSessionId)
    {
        var exists = await _dbContext.ClassSessions.AnyAsync(x => x.Id == classSessionId);
        if (!exists)
        {
            throw new InvalidOperationException($"Class session with id {classSessionId} was not found.");
        }
    }

    private async Task EnsureStudentEnrolledForClassSessionAsync(int studentId, int classSessionId)
    {
        var session = await _dbContext.ClassSessions
            .AsNoTracking()
            .Where(x => x.Id == classSessionId)
            .Select(x => new { x.Id, x.CourseId })
            .SingleOrDefaultAsync();

        if (session is null)
        {
            throw new InvalidOperationException($"Class session with id {classSessionId} was not found.");
        }

        var studentExists = await _dbContext.Students.AnyAsync(x => x.Id == studentId);
        if (!studentExists)
        {
            throw new InvalidOperationException($"Student with id {studentId} was not found.");
        }

        var isEnrolled = await _dbContext.Enrollments.AnyAsync(x =>
            x.StudentId == studentId &&
            x.CourseId == session.CourseId &&
            x.IsActive);

        if (!isEnrolled)
        {
            throw new InvalidOperationException("The student is not enrolled in the related course.");
        }
    }

    private static bool IsStudentAccessAllowed(ClassDocument document, DateTimeOffset now)
    {
        return document.VisibilityType switch
        {
            DocumentVisibilityType.AvailableImmediately => true,
            DocumentVisibilityType.AvailableBeforeClass => now < document.ClassSession.StartDateTime,
            DocumentVisibilityType.AvailableDuringClass => now >= document.ClassSession.StartDateTime && now <= document.ClassSession.EndDateTime,
            DocumentVisibilityType.AvailableAfterClass => now > document.ClassSession.EndDateTime,
            DocumentVisibilityType.AvailableAfterTeacherMarksCompleted => document.ClassSession.Status == ClassSessionStatus.Completed,
            _ => false
        };
    }

    private string GetUploadsRoot()
    {
        var root = string.IsNullOrWhiteSpace(_environment.WebRootPath)
            ? Path.Combine(_environment.ContentRootPath, "wwwroot")
            : _environment.WebRootPath;

        return Path.Combine(root, "uploads", "class-documents");
    }

    private static void ValidateFile(IFormFile file)
    {
        if (file.Length <= 0)
        {
            throw new InvalidOperationException("Uploaded file is empty.");
        }

        const long maxSizeBytes = 25 * 1024 * 1024;
        if (file.Length > maxSizeBytes)
        {
            throw new InvalidOperationException("Uploaded file exceeds the maximum allowed size of 25 MB.");
        }
    }

    private static string? NormalizeOptionalValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static Expression<Func<ClassDocument, ClassDocumentResponse>> MapToAdminResponseExpression()
    {
        return document => new ClassDocumentResponse
        {
            Id = document.Id,
            ClassSessionId = document.ClassSessionId,
            ClassSessionTitle = document.ClassSession.Title,
            Title = document.Title,
            Description = document.Description,
            OriginalFileName = document.OriginalFileName,
            StoredFileName = document.StoredFileName,
            StoragePath = document.StoragePath,
            FileType = document.FileType,
            FileSizeInBytes = document.FileSizeInBytes,
            VisibilityType = document.VisibilityType,
            IsActive = document.IsActive,
            UploadedByUserId = document.UploadedByUserId,
            UploadedAt = document.UploadedAt,
            UpdatedAt = document.UpdatedAt
        };
    }

    private static StudentClassDocumentResponse MapToStudentResponse(ClassDocument document)
    {
        return new StudentClassDocumentResponse
        {
            Id = document.Id,
            ClassSessionId = document.ClassSessionId,
            ClassSessionTitle = document.ClassSession.Title,
            Title = document.Title,
            Description = document.Description,
            OriginalFileName = document.OriginalFileName,
            FileType = document.FileType,
            FileSizeInBytes = document.FileSizeInBytes,
            VisibilityType = document.VisibilityType,
            UploadedAt = document.UploadedAt
        };
    }
}
