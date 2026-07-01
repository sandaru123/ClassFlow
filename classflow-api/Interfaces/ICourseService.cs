using ClassFlow.Api.DTOs.Courses;

namespace ClassFlow.Api.Interfaces;

public interface ICourseService
{
    Task<IReadOnlyList<CourseResponse>> GetAllAsync();

    Task<CourseResponse> GetByIdAsync(int id);

    Task<CourseResponse> CreateAsync(CreateCourseRequest request);

    Task<CourseResponse> UpdateAsync(int id, UpdateCourseRequest request);

    Task DeactivateAsync(int id);
}
