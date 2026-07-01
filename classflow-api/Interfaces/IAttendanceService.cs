using ClassFlow.Api.DTOs.Attendance;

namespace ClassFlow.Api.Interfaces;

public interface IAttendanceService
{
    Task<IReadOnlyList<AttendanceResponse>> GetAllAsync();

    Task<AttendanceResponse> GetByIdAsync(int id);

    Task<IReadOnlyList<AttendanceResponse>> GetByClassSessionIdAsync(int classSessionId);

    Task<IReadOnlyList<AttendanceResponse>> GetByStudentIdAsync(int studentId);

    Task<AttendanceResponse> MarkAttendanceAsync(MarkAttendanceRequest request);

    Task<IReadOnlyList<AttendanceResponse>> BulkMarkAttendanceAsync(BulkMarkAttendanceRequest request);

    Task<AttendanceResponse> UpdateAsync(int id, UpdateAttendanceRequest request);

    Task RemoveAsync(int id);
}
