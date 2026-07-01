using ClassFlow.Api.DTOs.Payments;

namespace ClassFlow.Api.Interfaces;

public interface IPaymentService
{
    Task<IReadOnlyList<PaymentResponse>> GetAllAsync();

    Task<PaymentResponse> GetByIdAsync(int id);

    Task<IReadOnlyList<PaymentResponse>> GetByStudentIdAsync(int studentId);

    Task<IReadOnlyList<PaymentResponse>> GetByCourseIdAsync(int courseId);

    Task<IReadOnlyList<PaymentResponse>> GetPendingPaymentsAsync();

    Task<PaymentResponse> CreateAsync(CreatePaymentRequest request);

    Task<PaymentResponse> UpdateAsync(int id, UpdatePaymentRequest request);

    Task<PaymentResponse> RecordPaymentAsync(int id, RecordPaymentRequest request);

    Task<PaymentResponse> CancelAsync(int id);
}
