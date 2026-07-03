using ClassFlow.Api.Constants;
using ClassFlow.Api.DTOs.Attendance;
using ClassFlow.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClassFlow.Api.Controllers;

[ApiController]
[Route("api/attendance")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;

    public AttendanceController(IAttendanceService attendanceService)
    {
        _attendanceService = attendanceService;
    }

    [HttpGet]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<IReadOnlyList<AttendanceResponse>>> GetAll()
    {
        var attendance = await _attendanceService.GetAllAsync();
        return Ok(attendance);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<AttendanceResponse>> GetById(int id)
    {
        try
        {
            var attendance = await _attendanceService.GetByIdAsync(id);
            return Ok(attendance);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("session/{classSessionId:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<IReadOnlyList<AttendanceResponse>>> GetByClassSessionId(int classSessionId)
    {
        try
        {
            var attendance = await _attendanceService.GetByClassSessionIdAsync(classSessionId);
            return Ok(attendance);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("student/{studentId:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<IReadOnlyList<AttendanceResponse>>> GetByStudentId(int studentId)
    {
        try
        {
            var attendance = await _attendanceService.GetByStudentIdAsync(studentId);
            return Ok(attendance);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<AttendanceResponse>> MarkAttendance([FromBody] MarkAttendanceRequest request)
    {
        try
        {
            var attendance = await _attendanceService.MarkAttendanceAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = attendance.Id }, attendance);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("bulk")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<IReadOnlyList<AttendanceResponse>>> BulkMarkAttendance([FromBody] BulkMarkAttendanceRequest request)
    {
        try
        {
            var attendance = await _attendanceService.BulkMarkAttendanceAsync(request);
            return Ok(attendance);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<ActionResult<AttendanceResponse>> Update(int id, [FromBody] UpdateAttendanceRequest request)
    {
        try
        {
            var attendance = await _attendanceService.UpdateAsync(id, request);
            return Ok(attendance);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = $"{AppRoles.SuperAdmin},{AppRoles.Admin},{AppRoles.Teacher}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            await _attendanceService.RemoveAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
