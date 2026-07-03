using System.Security.Claims;
using ClassFlow.Api.Constants;
using ClassFlow.Api.DTOs.ClassDocuments;
using ClassFlow.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClassFlow.Api.Controllers;

[ApiController]
[Route("api/class-documents")]
[Authorize]
public class ClassDocumentsController : ControllerBase
{
    private readonly IClassDocumentService _classDocumentService;

    public ClassDocumentsController(IClassDocumentService classDocumentService)
    {
        _classDocumentService = classDocumentService;
    }

    [HttpGet]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<IReadOnlyList<ClassDocumentResponse>>> GetAll()
    {
        var documents = await _classDocumentService.GetAllAsync();
        return Ok(documents);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<ClassDocumentResponse>> GetById(int id)
    {
        try
        {
            var document = await _classDocumentService.GetByIdAsync(id);
            return Ok(document);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("session/{classSessionId:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<IReadOnlyList<ClassDocumentResponse>>> GetByClassSessionId(int classSessionId)
    {
        try
        {
            var documents = await _classDocumentService.GetByClassSessionIdAsync(classSessionId);
            return Ok(documents);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("upload")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ClassDocumentResponse>> Upload([FromForm] UploadClassDocumentRequest request)
    {
        try
        {
            var uploadedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var document = await _classDocumentService.UploadAsync(request, uploadedByUserId);
            return CreatedAtAction(nameof(GetById), new { id = document.Id }, document);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<ClassDocumentResponse>> Update(int id, [FromBody] UpdateClassDocumentRequest request)
    {
        try
        {
            var document = await _classDocumentService.UpdateAsync(id, request);
            return Ok(document);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:int}/deactivate")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<IActionResult> Deactivate(int id)
    {
        try
        {
            await _classDocumentService.DeactivateAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
