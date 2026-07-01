namespace ClassFlow.Api.Constants;

public static class AppRoles
{
    public const string SuperAdmin = nameof(SuperAdmin);
    public const string Admin = nameof(Admin);
    public const string Teacher = nameof(Teacher);
    public const string Student = nameof(Student);
    public const string Parent = nameof(Parent);

    public static readonly string[] All = [SuperAdmin, Admin, Teacher, Student, Parent];

    public static readonly string[] Registerable = [Student, Parent];
}
