using ClassFlow.Api.DTOs.TeacherPortal;

namespace ClassFlow.Api.Interfaces;

public interface ITeacherPortalService
{
    Task<IReadOnlyList<TeacherCourseResponse>> GetMyCoursesAsync(string? applicationUserId);

    Task<IReadOnlyList<TeacherClassSessionResponse>> GetMyClassSessionsAsync(string? applicationUserId);

    Task<IReadOnlyList<TeacherClassSessionResponse>> GetMyUpcomingClassesAsync(string? applicationUserId);

    Task<IReadOnlyList<TeacherStudentResponse>> GetMyStudentsAsync(string? applicationUserId);

    Task<IReadOnlyList<TeacherAttendanceResponse>> GetMyAttendanceRecordsAsync(string? applicationUserId);

    Task<IReadOnlyList<TeacherDocumentResponse>> GetMyDocumentsAsync(string? applicationUserId);
}
