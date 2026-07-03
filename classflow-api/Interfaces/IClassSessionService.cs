using ClassFlow.Api.DTOs.ClassSessions;

namespace ClassFlow.Api.Interfaces;

public interface IClassSessionService
{
    Task<IReadOnlyList<ClassSessionResponse>> GetAllAsync();

    Task<ClassSessionResponse> GetByIdAsync(int id);

    Task<IReadOnlyList<ClassSessionResponse>> GetByCourseIdAsync(int courseId);

    Task<IReadOnlyList<ClassSessionResponse>> GetUpcomingAsync();

    Task<ClassSessionResponse> CreateAsync(CreateClassSessionRequest request);

    Task<ClassSessionResponse> UpdateAsync(int id, UpdateClassSessionRequest request);

    Task<ClassSessionResponse> CancelAsync(int id);

    Task<ClassSessionResponse> MarkCompletedAsync(int id);

    Task<ClassSessionResponse> ReactivateAsync(int id);

    Task DeleteForeverAsync(int id);
}
