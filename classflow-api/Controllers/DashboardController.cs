using System.Security.Claims;
using ClassFlow.Api.Constants;
using ClassFlow.Api.Data;
using ClassFlow.Api.DTOs.Dashboard;
using ClassFlow.Api.Interfaces;
using ClassFlow.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClassFlow.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(AppDbContext dbContext, IClassDocumentService classDocumentService)
    {
        _dashboardService = new DashboardService(dbContext, classDocumentService);
    }

    [HttpGet("admin")]
    [Authorize(Roles = AppRoles.SuperAdmin + "," + AppRoles.Admin)]
    public async Task<ActionResult<AdminDashboardResponse>> GetAdminDashboard()
    {
        var result = await _dashboardService.GetAdminDashboardAsync();
        return Ok(result);
    }

    [HttpGet("teacher")]
    [Authorize(Roles = AppRoles.Teacher)]
    public async Task<ActionResult<TeacherDashboardResponse>> GetTeacherDashboard()
    {
        try
        {
            var result = await _dashboardService.GetTeacherDashboardAsync(
                User.FindFirstValue(ClaimTypes.NameIdentifier));
            return Ok(result);
        }
        catch (InvalidOperationException)
        {
            return Forbid();
        }
    }

    [HttpGet("student")]
    [Authorize(Roles = AppRoles.Student)]
    public async Task<ActionResult<StudentDashboardResponse>> GetStudentDashboard()
    {
        try
        {
            var result = await _dashboardService.GetStudentDashboardAsync(
                User.FindFirstValue(ClaimTypes.NameIdentifier));
            return Ok(result);
        }
        catch (InvalidOperationException)
        {
            return Forbid();
        }
    }
}
