using ClassFlow.Api.DTOs.TeacherPortal;

namespace ClassFlow.Api.Interfaces;

public interface ITeacherPortalService
{
    Task<IReadOnlyList<TeacherCourseResponse>> GetMyCoursesAsync(string? email);

    Task<IReadOnlyList<TeacherClassSessionResponse>> GetMyClassSessionsAsync(string? email);

    Task<IReadOnlyList<TeacherClassSessionResponse>> GetMyUpcomingClassesAsync(string? email);

    Task<IReadOnlyList<TeacherStudentResponse>> GetMyStudentsAsync(string? email);

    Task<IReadOnlyList<TeacherAttendanceResponse>> GetMyAttendanceRecordsAsync(string? email);

    Task<IReadOnlyList<TeacherDocumentResponse>> GetMyDocumentsAsync(string? email);
}
