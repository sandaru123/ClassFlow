using ClassFlow.Api.DTOs.Dashboard;

namespace ClassFlow.Api.Interfaces;

public interface IDashboardService
{
    Task<AdminDashboardResponse> GetAdminDashboardAsync();
    Task<TeacherDashboardResponse> GetTeacherDashboardAsync(string? applicationUserId);
    Task<StudentDashboardResponse> GetStudentDashboardAsync(string? applicationUserId);
}
