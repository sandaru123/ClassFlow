using System.Security.Claims;
using ClassFlow.Api.DTOs.TeacherPortal;
using ClassFlow.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClassFlow.Api.Controllers;

[ApiController]
[Route("api/teacher-portal")]
[Authorize(Roles = "Teacher")]
public class TeacherPortalController : ControllerBase
{
    private readonly ITeacherPortalService _teacherPortalService;

    public TeacherPortalController(ITeacherPortalService teacherPortalService)
    {
        _teacherPortalService = teacherPortalService;
    }

    [HttpGet("my-courses")]
    public async Task<ActionResult<IReadOnlyList<TeacherCourseResponse>>> GetMyCourses()
    {
        return await ExecuteAsync(_teacherPortalService.GetMyCoursesAsync);
    }

    [HttpGet("my-class-sessions")]
    public async Task<ActionResult<IReadOnlyList<TeacherClassSessionResponse>>> GetMyClassSessions()
    {
        return await ExecuteAsync(_teacherPortalService.GetMyClassSessionsAsync);
    }

    [HttpGet("my-upcoming-classes")]
    public async Task<ActionResult<IReadOnlyList<TeacherClassSessionResponse>>> GetMyUpcomingClasses()
    {
        return await ExecuteAsync(_teacherPortalService.GetMyUpcomingClassesAsync);
    }

    [HttpGet("my-students")]
    public async Task<ActionResult<IReadOnlyList<TeacherStudentResponse>>> GetMyStudents()
    {
        return await ExecuteAsync(_teacherPortalService.GetMyStudentsAsync);
    }

    [HttpGet("my-attendance")]
    public async Task<ActionResult<IReadOnlyList<TeacherAttendanceResponse>>> GetMyAttendance()
    {
        return await ExecuteAsync(_teacherPortalService.GetMyAttendanceRecordsAsync);
    }

    [HttpGet("my-documents")]
    public async Task<ActionResult<IReadOnlyList<TeacherDocumentResponse>>> GetMyDocuments()
    {
        return await ExecuteAsync(_teacherPortalService.GetMyDocumentsAsync);
    }

    private async Task<ActionResult<IReadOnlyList<TResponse>>> ExecuteAsync<TResponse>(Func<string?, Task<IReadOnlyList<TResponse>>> action)
    {
        try
        {
            var email = User.FindFirstValue(ClaimTypes.Email);
            var result = await action(email);
            return Ok(result);
        }
        catch (InvalidOperationException)
        {
            return Forbid();
        }
    }
}
