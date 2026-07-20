using System.Security.Claims;
using ClassFlow.Api.Data;
using ClassFlow.Api.DTOs.ClassDocuments;
using ClassFlow.Api.Entities;
using ClassFlow.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ClassFlow.Api.Controllers;

[ApiController]
[Route("api/student")]
[Authorize(Roles = "Student")]
public class StudentClassDocumentsController : ControllerBase
{
    private readonly IClassDocumentService _classDocumentService;
    private readonly AppDbContext _dbContext;

    public StudentClassDocumentsController(IClassDocumentService classDocumentService, AppDbContext dbContext)
    {
        _classDocumentService = classDocumentService;
        _dbContext = dbContext;
    }

    [HttpGet("class-sessions/{classSessionId:int}/documents")]
    public async Task<ActionResult<IReadOnlyList<StudentClassDocumentResponse>>> GetAvailableDocuments(int classSessionId)
    {
        var student = await ResolveCurrentStudentAsync();
        if (student is null)
        {
            return Forbid();
        }

        try
        {
            var documents = await _classDocumentService.GetAvailableForStudentAsync(classSessionId, student.Id);
            return Ok(documents);
        }
        catch (InvalidOperationException)
        {
            return Forbid();
        }
    }

    [HttpGet("class-documents/{documentId:int}/download")]
    public async Task<IActionResult> Download(int documentId)
    {
        var student = await ResolveCurrentStudentAsync();
        if (student is null)
        {
            return Forbid();
        }

        var canAccess = await _classDocumentService.CanStudentAccessDocumentAsync(documentId, student.Id);
        if (!canAccess)
        {
            return Forbid();
        }

        try
        {
            var document = await _classDocumentService.DownloadAsync(documentId, null, true);
            return File(document.Content, document.ContentType, document.FileName);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (FileNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    private async Task<Student?> ResolveCurrentStudentAsync()
    {
        var applicationUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(applicationUserId))
        {
            return null;
        }

        return await _dbContext.Students
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.ApplicationUserId == applicationUserId);
    }
}
