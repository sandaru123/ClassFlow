using ClassFlow.Api.DTOs.Enrollments;

namespace ClassFlow.Api.Interfaces;

public interface IEnrollmentService
{
    Task<IReadOnlyList<EnrollmentResponse>> GetAllAsync();

    Task<EnrollmentResponse> GetByIdAsync(int id);

    Task<IReadOnlyList<EnrollmentResponse>> GetByStudentIdAsync(int studentId);

    Task<IReadOnlyList<EnrollmentResponse>> GetByCourseIdAsync(int courseId);

    Task<EnrollmentResponse> CreateAsync(CreateEnrollmentRequest request);

    Task<EnrollmentResponse> UpdateAsync(int id, UpdateEnrollmentRequest request);

    Task DeactivateAsync(int id);
}
