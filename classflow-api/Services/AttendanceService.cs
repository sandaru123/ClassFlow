using System.Linq.Expressions;
using ClassFlow.Api.Data;
using ClassFlow.Api.DTOs.Attendance;
using ClassFlow.Api.Entities;
using ClassFlow.Api.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ClassFlow.Api.Services;

public class AttendanceService : IAttendanceService
{
    private readonly AppDbContext _dbContext;

    public AttendanceService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<AttendanceResponse>> GetAllAsync()
    {
        return await _dbContext.AttendanceRecords
            .AsNoTracking()
            .OrderByDescending(x => x.MarkedAt)
            .Select(MapToResponseExpression())
            .ToListAsync();
    }

    public async Task<AttendanceResponse> GetByIdAsync(int id)
    {
        var attendance = await _dbContext.AttendanceRecords
            .AsNoTracking()
            .Where(x => x.Id == id)
            .Select(MapToResponseExpression())
            .SingleOrDefaultAsync();

        if (attendance is null)
        {
            throw new KeyNotFoundException($"Attendance record with id {id} was not found.");
        }

        return attendance;
    }

    public async Task<IReadOnlyList<AttendanceResponse>> GetByClassSessionIdAsync(int classSessionId)
    {
        await EnsureClassSessionExistsAsync(classSessionId);

        return await _dbContext.AttendanceRecords
            .AsNoTracking()
            .Where(x => x.ClassSessionId == classSessionId)
            .OrderBy(x => x.Student.FirstName)
            .ThenBy(x => x.Student.LastName)
            .Select(MapToResponseExpression())
            .ToListAsync();
    }

    public async Task<IReadOnlyList<AttendanceResponse>> GetByStudentIdAsync(int studentId)
    {
        await EnsureStudentExistsAsync(studentId);

        return await _dbContext.AttendanceRecords
            .AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.MarkedAt)
            .Select(MapToResponseExpression())
            .ToListAsync();
    }

    public async Task<AttendanceResponse> MarkAttendanceAsync(MarkAttendanceRequest request)
    {
        await EnsureEnrollmentForSessionAsync(request.StudentId, request.ClassSessionId);

        var exists = await _dbContext.AttendanceRecords.AnyAsync(x =>
            x.StudentId == request.StudentId && x.ClassSessionId == request.ClassSessionId);

        if (exists)
        {
            throw new InvalidOperationException("Attendance record already exists for this student and class session.");
        }

        var now = DateTimeOffset.UtcNow;
        var attendance = new AttendanceRecord
        {
            StudentId = request.StudentId,
            ClassSessionId = request.ClassSessionId,
            Status = request.Status,
            Notes = NormalizeOptionalValue(request.Notes),
            MarkedAt = now,
            CreatedAt = now
        };

        _dbContext.AttendanceRecords.Add(attendance);
        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(attendance.Id);
    }

    public async Task<IReadOnlyList<AttendanceResponse>> BulkMarkAttendanceAsync(BulkMarkAttendanceRequest request)
    {
        await EnsureClassSessionExistsAsync(request.ClassSessionId);

        var session = await _dbContext.ClassSessions
            .AsNoTracking()
            .Where(x => x.Id == request.ClassSessionId)
            .Select(x => new { x.Id, x.CourseId })
            .SingleAsync();

        var studentIds = request.Items.Select(x => x.StudentId).Distinct().ToArray();
        var existingStudents = await _dbContext.Students
            .Where(x => studentIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync();

        var missingStudentId = studentIds.FirstOrDefault(id => !existingStudents.Contains(id));
        if (missingStudentId != 0)
        {
            throw new InvalidOperationException($"Student with id {missingStudentId} was not found.");
        }

        var validEnrollmentStudentIds = await _dbContext.Enrollments
            .Where(x => x.CourseId == session.CourseId && x.IsActive && studentIds.Contains(x.StudentId))
            .Select(x => x.StudentId)
            .Distinct()
            .ToListAsync();

        var invalidStudentId = studentIds.FirstOrDefault(id => !validEnrollmentStudentIds.Contains(id));
        if (invalidStudentId != 0)
        {
            throw new InvalidOperationException($"Student with id {invalidStudentId} is not enrolled in the related course.");
        }

        var existingRecords = await _dbContext.AttendanceRecords
            .Where(x => x.ClassSessionId == request.ClassSessionId && studentIds.Contains(x.StudentId))
            .ToListAsync();

        var now = DateTimeOffset.UtcNow;
        foreach (var item in request.Items)
        {
            var existingRecord = existingRecords.SingleOrDefault(x => x.StudentId == item.StudentId);
            if (existingRecord is null)
            {
                _dbContext.AttendanceRecords.Add(new AttendanceRecord
                {
                    StudentId = item.StudentId,
                    ClassSessionId = request.ClassSessionId,
                    Status = item.Status,
                    Notes = NormalizeOptionalValue(item.Notes),
                    MarkedAt = now,
                    CreatedAt = now
                });
            }
            else
            {
                existingRecord.Status = item.Status;
                existingRecord.Notes = NormalizeOptionalValue(item.Notes);
                existingRecord.MarkedAt = now;
                existingRecord.UpdatedAt = now;
            }
        }

        await _dbContext.SaveChangesAsync();

        return await GetByClassSessionIdAsync(request.ClassSessionId);
    }

    public async Task<AttendanceResponse> UpdateAsync(int id, UpdateAttendanceRequest request)
    {
        var attendance = await _dbContext.AttendanceRecords.SingleOrDefaultAsync(x => x.Id == id);
        if (attendance is null)
        {
            throw new KeyNotFoundException($"Attendance record with id {id} was not found.");
        }

        var now = DateTimeOffset.UtcNow;
        attendance.Status = request.Status;
        attendance.Notes = NormalizeOptionalValue(request.Notes);
        attendance.MarkedAt = now;
        attendance.UpdatedAt = now;

        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(id);
    }

    public async Task RemoveAsync(int id)
    {
        var attendance = await _dbContext.AttendanceRecords.SingleOrDefaultAsync(x => x.Id == id);
        if (attendance is null)
        {
            throw new KeyNotFoundException($"Attendance record with id {id} was not found.");
        }

        _dbContext.AttendanceRecords.Remove(attendance);
        await _dbContext.SaveChangesAsync();
    }

    private async Task EnsureStudentExistsAsync(int studentId)
    {
        var exists = await _dbContext.Students.AnyAsync(x => x.Id == studentId);
        if (!exists)
        {
            throw new InvalidOperationException($"Student with id {studentId} was not found.");
        }
    }

    private async Task EnsureClassSessionExistsAsync(int classSessionId)
    {
        var exists = await _dbContext.ClassSessions.AnyAsync(x => x.Id == classSessionId);
        if (!exists)
        {
            throw new InvalidOperationException($"Class session with id {classSessionId} was not found.");
        }
    }

    private async Task EnsureEnrollmentForSessionAsync(int studentId, int classSessionId)
    {
        await EnsureStudentExistsAsync(studentId);

        var session = await _dbContext.ClassSessions
            .AsNoTracking()
            .Where(x => x.Id == classSessionId)
            .Select(x => new { x.Id, x.CourseId })
            .SingleOrDefaultAsync();

        if (session is null)
        {
            throw new InvalidOperationException($"Class session with id {classSessionId} was not found.");
        }

        var isEnrolled = await _dbContext.Enrollments.AnyAsync(x =>
            x.StudentId == studentId &&
            x.CourseId == session.CourseId &&
            x.IsActive);

        if (!isEnrolled)
        {
            throw new InvalidOperationException("The student is not enrolled in the related course of this class session.");
        }
    }

    private static string? NormalizeOptionalValue(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static Expression<Func<AttendanceRecord, AttendanceResponse>> MapToResponseExpression()
    {
        return attendance => new AttendanceResponse
        {
            Id = attendance.Id,
            StudentId = attendance.StudentId,
            StudentName = (attendance.Student.FirstName + " " + attendance.Student.LastName).Trim(),
            ClassSessionId = attendance.ClassSessionId,
            ClassSessionTitle = attendance.ClassSession.Title,
            Status = attendance.Status,
            Notes = attendance.Notes,
            MarkedAt = attendance.MarkedAt,
            CreatedAt = attendance.CreatedAt,
            UpdatedAt = attendance.UpdatedAt
        };
    }
}
