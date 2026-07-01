using ClassFlow.Api.DTOs.StudentPortal;

namespace ClassFlow.Api.Interfaces;

public interface IStudentPortalService
{
    Task<IReadOnlyList<MyCourseResponse>> GetMyCoursesAsync(string? email);

    Task<IReadOnlyList<MyClassSessionResponse>> GetMyUpcomingClassesAsync(string? email);

    Task<IReadOnlyList<MyClassSessionResponse>> GetMyClassSessionsAsync(string? email);

    Task<IReadOnlyList<MyPaymentResponse>> GetMyPaymentsAsync(string? email);

    Task<IReadOnlyList<MyAttendanceResponse>> GetMyAttendanceAsync(string? email);

    Task<IReadOnlyList<MyDocumentResponse>> GetMyAvailableDocumentsAsync(string? email);
}
