using System.Security.Claims;
using ClassFlow.Api.DTOs.StudentPortal;
using ClassFlow.Api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ClassFlow.Api.Controllers;

[ApiController]
[Route("api/student-portal")]
[Authorize(Roles = "Student")]
public class StudentPortalController : ControllerBase
{
    private readonly IStudentPortalService _studentPortalService;

    public StudentPortalController(IStudentPortalService studentPortalService)
    {
        _studentPortalService = studentPortalService;
    }

    [HttpGet("my-courses")]
    public async Task<ActionResult<IReadOnlyList<MyCourseResponse>>> GetMyCourses()
    {
        return await ExecuteAsync(_studentPortalService.GetMyCoursesAsync);
    }

    [HttpGet("my-upcoming-classes")]
    public async Task<ActionResult<IReadOnlyList<MyClassSessionResponse>>> GetMyUpcomingClasses()
    {
        return await ExecuteAsync(_studentPortalService.GetMyUpcomingClassesAsync);
    }

    [HttpGet("my-class-sessions")]
    public async Task<ActionResult<IReadOnlyList<MyClassSessionResponse>>> GetMyClassSessions()
    {
        return await ExecuteAsync(_studentPortalService.GetMyClassSessionsAsync);
    }

    [HttpGet("my-payments")]
    public async Task<ActionResult<IReadOnlyList<MyPaymentResponse>>> GetMyPayments()
    {
        return await ExecuteAsync(_studentPortalService.GetMyPaymentsAsync);
    }

    [HttpGet("my-attendance")]
    public async Task<ActionResult<IReadOnlyList<MyAttendanceResponse>>> GetMyAttendance()
    {
        return await ExecuteAsync(_studentPortalService.GetMyAttendanceAsync);
    }

    [HttpGet("my-documents")]
    public async Task<ActionResult<IReadOnlyList<MyDocumentResponse>>> GetMyDocuments()
    {
        return await ExecuteAsync(_studentPortalService.GetMyAvailableDocumentsAsync);
    }

    private async Task<ActionResult<IReadOnlyList<TResponse>>> ExecuteAsync<TResponse>(Func<string?, Task<IReadOnlyList<TResponse>>> action)
    {
        try
        {
            var applicationUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await action(applicationUserId);
            return Ok(result);
        }
        catch (InvalidOperationException)
        {
            return Forbid();
        }
    }
}
