using ClassFlow.Api.DTOs.Students;

namespace ClassFlow.Api.Interfaces;

public interface IStudentService
{
    Task<IReadOnlyList<StudentResponse>> GetAllAsync();

    Task<StudentResponse> GetByIdAsync(int id);

    Task<StudentResponse> CreateAsync(CreateStudentRequest request);

    Task<StudentResponse> UpdateAsync(int id, UpdateStudentRequest request);

    Task DeactivateAsync(int id);

    Task ReactivateAsync(int id);

    Task DeleteForeverAsync(int id);
}
