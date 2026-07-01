using System.Linq.Expressions;
using ClassFlow.Api.Data;
using ClassFlow.Api.DTOs.Payments;
using ClassFlow.Api.Entities;
using ClassFlow.Api.Enums;
using ClassFlow.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClassFlow.Api.Services;

public class PaymentService : IPaymentService
{
    private readonly AppDbContext _dbContext;

    public PaymentService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<PaymentResponse>> GetAllAsync()
    {
        return await _dbContext.Payments
            .AsNoTracking()
            .OrderByDescending(x => x.PaymentYear)
            .ThenByDescending(x => x.PaymentMonth)
            .ThenByDescending(x => x.CreatedAt)
            .Select(MapToResponseExpression())
            .ToListAsync();
    }

    public async Task<PaymentResponse> GetByIdAsync(int id)
    {
        var payment = await _dbContext.Payments
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(MapToResponseExpression())
            .SingleOrDefaultAsync();

        if (payment is null)
        {
            throw new KeyNotFoundException($"Payment with id {id} was not found.");
        }

        return payment;
    }

    public async Task<IReadOnlyList<PaymentResponse>> GetByStudentIdAsync(int studentId)
    {
        await EnsureStudentExistsAsync(studentId);

        return await _dbContext.Payments
            .AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.PaymentYear)
            .ThenByDescending(x => x.PaymentMonth)
            .Select(MapToResponseExpression())
            .ToListAsync();
    }

    public async Task<IReadOnlyList<PaymentResponse>> GetByCourseIdAsync(int courseId)
    {
        await EnsureCourseExistsAsync(courseId);

        return await _dbContext.Payments
            .AsNoTracking()
            .Where(x => x.CourseId == courseId)
            .OrderByDescending(x => x.PaymentYear)
            .ThenByDescending(x => x.PaymentMonth)
            .Select(MapToResponseExpression())
            .ToListAsync();
    }

    public async Task<IReadOnlyList<PaymentResponse>> GetPendingPaymentsAsync()
    {
        return await _dbContext.Payments
            .AsNoTracking()
            .Where(x => x.IsActive && x.PaymentStatus != PaymentStatus.Cancelled && x.BalanceAmount > 0)
            .OrderByDescending(x => x.PaymentYear)
            .ThenByDescending(x => x.PaymentMonth)
            .Select(MapToResponseExpression())
            .ToListAsync();
    }

    public async Task<PaymentResponse> CreateAsync(CreatePaymentRequest request)
    {
        var enrollment = await EnsureActiveEnrollmentAsync(request.StudentId, request.CourseId);
        await EnsureNoDuplicateActivePaymentAsync(request.StudentId, request.CourseId, request.PaymentMonth, request.PaymentYear);

        var payment = new Payment
        {
            EnrollmentId = enrollment.Id,
            StudentId = request.StudentId,
            CourseId = request.CourseId,
            Amount = request.Amount,
            PaidAmount = 0m,
            BalanceAmount = request.Amount,
            PaymentMonth = request.PaymentMonth,
            PaymentYear = request.PaymentYear,
            PaymentMethod = request.PaymentMethod,
            PaymentStatus = request.PaymentStatus == PaymentStatus.Cancelled ? PaymentStatus.Pending : NormalizeStatus(request.Amount, 0m),
            PaymentDate = null,
            Notes = NormalizeOptionalValue(request.Notes),
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.Payments.Add(payment);
        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(payment.Id);
    }

    public async Task<PaymentResponse> UpdateAsync(int id, UpdatePaymentRequest request)
    {
        var payment = await _dbContext.Payments.SingleOrDefaultAsync(x => x.Id == id);
        if (payment is null)
        {
            throw new KeyNotFoundException($"Payment with id {id} was not found.");
        }

        var enrollment = await EnsureActiveEnrollmentAsync(request.StudentId, request.CourseId);
        if (request.IsActive)
        {
            await EnsureNoDuplicateActivePaymentAsync(request.StudentId, request.CourseId, request.PaymentMonth, request.PaymentYear, id);
        }

        ValidateAmounts(request.Amount, request.PaidAmount);

        payment.EnrollmentId = enrollment.Id;
        payment.StudentId = request.StudentId;
        payment.CourseId = request.CourseId;
        payment.Amount = request.Amount;
        payment.PaidAmount = request.PaidAmount;
        payment.BalanceAmount = request.Amount - request.PaidAmount;
        payment.PaymentMonth = request.PaymentMonth;
        payment.PaymentYear = request.PaymentYear;
        payment.PaymentMethod = request.PaymentMethod;
        payment.PaymentStatus = request.PaymentStatus == PaymentStatus.Cancelled
            ? PaymentStatus.Cancelled
            : NormalizeStatus(request.Amount, request.PaidAmount);
        payment.PaymentDate = request.PaidAmount > 0 ? request.PaymentDate ?? payment.PaymentDate ?? DateTimeOffset.UtcNow : null;
        payment.Notes = NormalizeOptionalValue(request.Notes);
        payment.IsActive = request.IsActive;
        payment.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<PaymentResponse> RecordPaymentAsync(int id, RecordPaymentRequest request)
    {
        var payment = await _dbContext.Payments.SingleOrDefaultAsync(x => x.Id == id);
        if (payment is null)
        {
            throw new KeyNotFoundException($"Payment with id {id} was not found.");
        }

        if (!payment.IsActive || payment.PaymentStatus == PaymentStatus.Cancelled)
        {
            throw new InvalidOperationException("Cancelled or inactive payments cannot be recorded.");
        }

        var newPaidAmount = payment.PaidAmount + request.Amount;
        ValidateAmounts(payment.Amount, newPaidAmount);

        payment.PaidAmount = newPaidAmount;
        payment.BalanceAmount = payment.Amount - newPaidAmount;
        payment.PaymentStatus = NormalizeStatus(payment.Amount, newPaidAmount);
        payment.PaymentMethod = request.PaymentMethod ?? payment.PaymentMethod;
        payment.PaymentDate = request.PaymentDate ?? DateTimeOffset.UtcNow;
        payment.Notes = AppendNotes(payment.Notes, request.Notes);
        payment.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task<PaymentResponse> CancelAsync(int id)
    {
        var payment = await _dbContext.Payments.SingleOrDefaultAsync(x => x.Id == id);
        if (payment is null)
        {
            throw new KeyNotFoundException($"Payment with id {id} was not found.");
        }

        if (payment.PaymentStatus != PaymentStatus.Cancelled || payment.IsActive)
        {
            payment.PaymentStatus = PaymentStatus.Cancelled;
            payment.IsActive = false;
            payment.UpdatedAt = DateTimeOffset.UtcNow;
            await _dbContext.SaveChangesAsync();
        }

        return await GetByIdAsync(id);
    }

    private async Task EnsureStudentExistsAsync(int studentId)
    {
        var exists = await _dbContext.Students.AnyAsync(x => x.Id == studentId);
        if (!exists)
        {
            throw new InvalidOperationException($"Student with id {studentId} was not found.");
        }
    }

    private async Task EnsureCourseExistsAsync(int courseId)
    {
        var exists = await _dbContext.Courses.AnyAsync(x => x.Id == courseId);
        if (!exists)
        {
            throw new InvalidOperationException($"Course with id {courseId} was not found.");
        }
    }

    private async Task<Enrollment> EnsureActiveEnrollmentAsync(int studentId, int courseId)
    {
        await EnsureStudentExistsAsync(studentId);
        await EnsureCourseExistsAsync(courseId);

        var enrollment = await _dbContext.Enrollments
            .Where(x => x.StudentId == studentId && x.CourseId == courseId && x.IsActive)
            .OrderByDescending(x => x.CreatedAt)
            .FirstOrDefaultAsync();

        if (enrollment is null)
        {
            throw new InvalidOperationException("The student is not actively enrolled in the specified course.");
        }

        return enrollment;
    }

    private async Task EnsureNoDuplicateActivePaymentAsync(int studentId, int courseId, int paymentMonth, int paymentYear, int? currentPaymentId = null)
    {
        var exists = await _dbContext.Payments.AnyAsync(x =>
            x.StudentId == studentId &&
            x.CourseId == courseId &&
            x.PaymentMonth == paymentMonth &&
            x.PaymentYear == paymentYear &&
            x.IsActive &&
            (!currentPaymentId.HasValue || x.Id != currentPaymentId.Value));

        if (exists)
        {
            throw new InvalidOperationException("An active payment record already exists for this student, course, month, and year.");
        }
    }

    private static void ValidateAmounts(decimal amount, decimal paidAmount)
    {
        if (amount <= 0)
        {
            throw new InvalidOperationException("Amount must be greater than zero.");
        }

        if (paidAmount < 0)
        {
            throw new InvalidOperationException("PaidAmount cannot be negative.");
        }

        if (paidAmount > amount)
        {
            throw new InvalidOperationException("PaidAmount cannot exceed Amount.");
        }
    }

    private static PaymentStatus NormalizeStatus(decimal amount, decimal paidAmount)
    {
        if (paidAmount <= 0)
        {
            return PaymentStatus.Pending;
        }

        if (paidAmount >= amount)
        {
            return PaymentStatus.Paid;
        }

        return PaymentStatus.PartiallyPaid;
    }

    private static string? NormalizeOptionalValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string? AppendNotes(string? existingNotes, string? newNotes)
    {
        var normalizedNewNotes = NormalizeOptionalValue(newNotes);
        if (normalizedNewNotes is null)
        {
            return existingNotes;
        }

        var normalizedExisting = NormalizeOptionalValue(existingNotes);
        if (normalizedExisting is null)
        {
            return normalizedNewNotes;
        }

        return $"{normalizedExisting}\n{normalizedNewNotes}";
    }

    private static Expression<Func<Payment, PaymentResponse>> MapToResponseExpression()
    {
        return payment => new PaymentResponse
        {
            Id = payment.Id,
            StudentId = payment.StudentId,
            StudentName = (payment.Student.FirstName + " " + payment.Student.LastName).Trim(),
            CourseId = payment.CourseId,
            CourseName = payment.Course.Name,
            Amount = payment.Amount,
            PaidAmount = payment.PaidAmount,
            BalanceAmount = payment.BalanceAmount,
            PaymentMonth = payment.PaymentMonth,
            PaymentYear = payment.PaymentYear,
            PaymentMethod = payment.PaymentMethod,
            PaymentStatus = payment.PaymentStatus,
            PaymentDate = payment.PaymentDate,
            Notes = payment.Notes,
            IsActive = payment.IsActive,
            CreatedAt = payment.CreatedAt,
            UpdatedAt = payment.UpdatedAt
        };
    }
}
