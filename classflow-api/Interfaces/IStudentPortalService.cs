using ClassFlow.Api.DTOs.StudentPortal;

namespace ClassFlow.Api.Interfaces;

public interface IStudentPortalService
{
    Task<IReadOnlyList<MyCourseResponse>> GetMyCoursesAsync(string? applicationUserId);

    Task<IReadOnlyList<MyClassSessionResponse>> GetMyUpcomingClassesAsync(string? applicationUserId);

    Task<IReadOnlyList<MyClassSessionResponse>> GetMyClassSessionsAsync(string? applicationUserId);

    Task<IReadOnlyList<MyPaymentResponse>> GetMyPaymentsAsync(string? applicationUserId);

    Task<IReadOnlyList<MyAttendanceResponse>> GetMyAttendanceAsync(string? applicationUserId);

    Task<IReadOnlyList<MyDocumentResponse>> GetMyAvailableDocumentsAsync(string? applicationUserId);
}
