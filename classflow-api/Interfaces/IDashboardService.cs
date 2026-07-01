using ClassFlow.Api.DTOs.Dashboard;

namespace ClassFlow.Api.Interfaces;

public interface IDashboardService
{
    Task<AdminDashboardResponse> GetAdminDashboardAsync();
    Task<TeacherDashboardResponse> GetTeacherDashboardAsync(string? email);
    Task<StudentDashboardResponse> GetStudentDashboardAsync(string? email);
}
