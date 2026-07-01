using ClassFlow.Api.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ClassFlow.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
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

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Teacher>(entity =>
        {
            entity.HasMany(x => x.Courses)
                .WithOne(x => x.Teacher)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasMany(x => x.ClassSessions)
                .WithOne(x => x.Teacher)
                .HasForeignKey(x => x.TeacherId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Student>(entity =>
        {
            entity.HasMany(x => x.Enrollments)
                .WithOne(x => x.Student)
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasMany(x => x.AttendanceRecords)
                .WithOne(x => x.Student)
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasMany(x => x.Payments)
                .WithOne(x => x.Student)
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Course>(entity =>
        {
            entity.Property(x => x.MonthlyFee).HasPrecision(18, 2);

            entity.HasMany(x => x.Enrollments)
                .WithOne(x => x.Course)
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasMany(x => x.ClassSessions)
                .WithOne(x => x.Course)
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasMany(x => x.Payments)
                .WithOne(x => x.Course)
                .HasForeignKey(x => x.CourseId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<Enrollment>(entity =>
        {
            entity.HasIndex(x => new { x.StudentId, x.CourseId, x.IsActive });

            entity.HasMany(x => x.Payments)
                .WithOne(x => x.Enrollment)
                .HasForeignKey(x => x.EnrollmentId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<ClassSession>(entity =>
        {
            entity.HasMany(x => x.ClassDocuments)
                .WithOne(x => x.ClassSession)
                .HasForeignKey(x => x.ClassSessionId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasMany(x => x.AttendanceRecords)
                .WithOne(x => x.ClassSession)
                .HasForeignKey(x => x.ClassSessionId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<AttendanceRecord>(entity =>
        {
            entity.HasIndex(x => new { x.StudentId, x.ClassSessionId })
                .IsUnique();
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.Property(x => x.Amount).HasPrecision(18, 2);
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(x => x.Id);

            entity.Property(x => x.UserId)
                .IsRequired()
                .HasMaxLength(450);

            entity.Property(x => x.TokenHash)
                .IsRequired()
                .HasMaxLength(128);

            entity.Property(x => x.ReplacedByToken)
                .HasMaxLength(128);

            entity.HasIndex(x => x.TokenHash)
                .IsUnique();

            entity.HasIndex(x => x.UserId);

            entity.HasIndex(x => x.ExpiresAt);

            entity.HasOne(x => x.User)
                .WithMany(x => x.RefreshTokens)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}



