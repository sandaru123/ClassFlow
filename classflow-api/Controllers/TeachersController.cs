using ClassFlow.Api.Constants;
using ClassFlow.Api.DTOs.Teachers;
using ClassFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClassFlow.Api.Controllers;

[ApiController]
[Route("api/teachers")]
[Authorize]
public class TeachersController : ControllerBase
{
    private readonly TeacherService _teacherService;

    public TeachersController(TeacherService teacherService)
    {
        _teacherService = teacherService;
    }

    [HttpGet]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin}")]
    public async Task<ActionResult<IReadOnlyList<TeacherResponse>>> GetAll()
    {
        var teachers = await _teacherService.GetAllAsync();
        return Ok(teachers);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin}")]
    public async Task<ActionResult<TeacherResponse>> GetById(int id)
    {
        try
        {
            var teacher = await _teacherService.GetByIdAsync(id);
            return Ok(teacher);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin}")]
    public async Task<ActionResult<TeacherResponse>> Create([FromBody] CreateTeacherRequest request)
    {
        try
        {
            var teacher = await _teacherService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = teacher.Id }, teacher);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin}")]
    public async Task<ActionResult<TeacherResponse>> Update(int id, [FromBody] UpdateTeacherRequest request)
    {
        try
        {
            var teacher = await _teacherService.UpdateAsync(id, request);
            return Ok(teacher);
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

    [HttpPatch("{id:int}/deactivate")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin}")]
    public async Task<IActionResult> Deactivate(int id)
    {
        try
        {
            await _teacherService.DeactivateAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
