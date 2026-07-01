using ClassFlow.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace ClassFlow.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Student> Students => Set<Student>();

    public DbSet<Teacher> Teachers => Set<Teacher>();

    public DbSet<Course> Courses => Set<Course>();

    public DbSet<Enrollment> Enrollments => Set<Enrollment>();

    public DbSet<ClassSession> ClassSessions => Set<ClassSession>();

    public DbSet<ClassDocument> ClassDocuments => Set<ClassDocument>();

    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();

    public DbSet<Payment> Payments => Set<Payment>();
}
