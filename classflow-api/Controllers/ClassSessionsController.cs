using ClassFlow.Api.Constants;
using ClassFlow.Api.DTOs.ClassSessions;
using ClassFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClassFlow.Api.Controllers;

[ApiController]
[Route("api/class-sessions")]
[Authorize]
public class ClassSessionsController : ControllerBase
{
    private readonly ClassSessionService _classSessionService;

    public ClassSessionsController(ClassSessionService classSessionService)
    {
        _classSessionService = classSessionService;
    }

    [HttpGet]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<IReadOnlyList<ClassSessionResponse>>> GetAll()
    {
        var classSessions = await _classSessionService.GetAllAsync();
        return Ok(classSessions);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<ClassSessionResponse>> GetById(int id)
    {
        try
        {
            var classSession = await _classSessionService.GetByIdAsync(id);
            return Ok(classSession);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("course/{courseId:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<IReadOnlyList<ClassSessionResponse>>> GetByCourseId(int courseId)
    {
        try
        {
            var classSessions = await _classSessionService.GetByCourseIdAsync(courseId);
            return Ok(classSessions);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("upcoming")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<IReadOnlyList<ClassSessionResponse>>> GetUpcoming()
    {
        var classSessions = await _classSessionService.GetUpcomingAsync();
        return Ok(classSessions);
    }

    [HttpPost]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<ClassSessionResponse>> Create([FromBody] CreateClassSessionRequest request)
    {
        try
        {
            var classSession = await _classSessionService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = classSession.Id }, classSession);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<ClassSessionResponse>> Update(int id, [FromBody] UpdateClassSessionRequest request)
    {
        try
        {
            var classSession = await _classSessionService.UpdateAsync(id, request);
            return Ok(classSession);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:int}/cancel")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<ClassSessionResponse>> Cancel(int id)
    {
        try
        {
            var classSession = await _classSessionService.CancelAsync(id);
            return Ok(classSession);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:int}/complete")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<ClassSessionResponse>> MarkCompleted(int id)
    {
        try
        {
            var classSession = await _classSessionService.MarkCompletedAsync(id);
            return Ok(classSession);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
