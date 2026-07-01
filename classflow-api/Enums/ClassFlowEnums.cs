namespace ClassFlow.Api.Enums;

public enum ClassSessionStatus
{
    Scheduled = 0,
    Ongoing = 1,
    Completed = 2,
    Cancelled = 3
}

public enum ClassMode
{
    Physical = 0,
    Online = 1,
    Hybrid = 2
}

public enum EnrollmentStatus
{
    Active = 0,
    Completed = 1,
    Dropped = 2,
    Cancelled = 3
}

public enum DocumentVisibilityType
{
    AvailableImmediately = 0,
    AvailableBeforeClass = 1,
    AvailableDuringClass = 2,
    AvailableAfterClass = 3,
    AvailableAfterTeacherMarksCompleted = 4
}

public enum AttendanceStatus
{
    Present = 0,
    Absent = 1,
    Late = 2,
    Excused = 3
}

public enum PaymentStatus
{
    Pending = 0,
    PartiallyPaid = 1,
    Paid = 2,
    Overdue = 3,
    Cancelled = 4
}

public enum PaymentMethod
{
    Cash = 0,
    BankTransfer = 1,
    Card = 2,
    Cheque = 3,
    Other = 4
}
