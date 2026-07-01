using ClassFlow.Api.DTOs.Teachers;

namespace ClassFlow.Api.Interfaces;

public interface ITeacherService
{
    Task<IReadOnlyList<TeacherResponse>> GetAllAsync();

    Task<TeacherResponse> GetByIdAsync(int id);

    Task<TeacherResponse> CreateAsync(CreateTeacherRequest request);

    Task<TeacherResponse> UpdateAsync(int id, UpdateTeacherRequest request);

    Task DeactivateAsync(int id);
}
