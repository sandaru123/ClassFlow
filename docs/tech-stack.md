# Online Class Management System - Technical Stack

## 1. Project Overview

This document defines the recommended technical stack for the **Online Class Management System** project.

The system will include an admin/teacher portal, student portal, class scheduling, online class links, attendance tracking, payment tracking, document uploads, and document visibility rules.

The recommended stack is designed to be:

- Practical for real-world business applications
- Suitable for a .NET-focused portfolio project
- Easy to extend later with payments, Zoom, Google Meet, and cloud storage
- Cleanly separated between frontend and backend

---

## 2. Recommended Stack Summary

| Layer | Recommended Technology |
|---|---|
| Frontend | React + TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Backend | ASP.NET Core Web API |
| Language | C# |
| Database | SQL Server |
| ORM | Entity Framework Core |
| Authentication | ASP.NET Core Identity + JWT |
| File Storage | Local storage first, Azure Blob Storage later |
| Reports | QuestPDF + ClosedXML |
| Notifications | SMTP first, SendGrid later |
| Meeting Integration | Manual Zoom/Google Meet links first, APIs later |
| Payments | Manual tracking first, PayHere/Stripe later |
| Hosting | Azure App Service + Azure SQL |
| Version Control | Git + GitHub |

---

## 3. Frontend Stack

### Recommended Technologies

- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Router
- Axios
- React Query
- React Hook Form
- Zod
- Lucide React
- FullCalendar

### Why React + TypeScript?

React is a good choice for building a modern admin panel and student dashboard. TypeScript helps reduce bugs by adding type safety.

This frontend will be used for:

- Admin dashboard
- Teacher dashboard
- Student dashboard
- Course management screens
- Class session calendar
- Attendance marking UI
- Payment tracking screens
- Document upload and document viewing screens

### Suggested Frontend Libraries

| Library | Purpose |
|---|---|
| React Router | Page navigation and routing |
| Axios | API calls |
| React Query | API state management and caching |
| React Hook Form | Form handling |
| Zod | Form validation |
| Tailwind CSS | Styling |
| shadcn/ui | UI components |
| Lucide React | Icons |
| FullCalendar | Timetable and class calendar |

---

## 4. Backend Stack

### Recommended Technologies

- ASP.NET Core Web API
- C#
- Entity Framework Core
- ASP.NET Core Identity
- JWT Authentication

### Why ASP.NET Core Web API?

ASP.NET Core Web API is a strong choice for business applications. It works well with SQL Server, role-based authorization, secure APIs, and future integrations such as payment gateways and meeting APIs.

The backend will handle:

- Authentication and authorization
- Student management
- Teacher management
- Course management
- Class session scheduling
- Attendance records
- Payment tracking
- Document uploads
- Secure document downloads
- Announcements
- Reports
- Online meeting link management

---

## 5. Backend Project Structure

Recommended backend structure:

```text
classflow-api/
│
├── Controllers/
├── Services/
├── Repositories/
├── Data/
├── Entities/
├── DTOs/
├── Helpers/
├── Middlewares/
├── Migrations/
└── Program.cs
```

### Folder Responsibilities

| Folder | Purpose |
|---|---|
| Controllers | API endpoints |
| Services | Business logic |
| Repositories | Database access logic, if repository pattern is used |
| Data | DbContext and database configuration |
| Entities | Database models |
| DTOs | Request and response models |
| Helpers | Utility classes |
| Middlewares | Custom middleware such as error handling |
| Migrations | EF Core database migrations |

---

## 6. Database Stack

### Recommended Database

- SQL Server
- Entity Framework Core

SQL Server is recommended because it works very well with .NET and is widely used in business applications.

### Main Tables

```text
Users
Roles
Students
Teachers
Courses
Enrollments
ClassSessions
ClassDocuments
AttendanceRecords
Payments
Announcements
OnlineMeetings
AuditLogs
```

### Important Database Notes

- Use Entity Framework Core migrations to manage database changes.
- Store file metadata in the database, not the actual file binary for the MVP.
- Store only secure references to uploaded documents.
- Use relationships between students, courses, sessions, and documents to enforce access rules.

---

## 7. Authentication and Authorization

### Recommended Approach

- ASP.NET Core Identity
- JWT Authentication
- Role-based Authorization

### User Roles

```text
SuperAdmin
Admin
Teacher
Student
Parent
```

### Role Permissions

| Role | Permissions |
|---|---|
| SuperAdmin | Manage everything in the system |
| Admin | Manage students, teachers, courses, sessions, payments, and reports |
| Teacher | Manage assigned courses, sessions, attendance, and documents |
| Student | View own courses, sessions, documents, attendance, and payments |
| Parent | View child attendance, payments, and announcements |

---

## 8. File Upload and Document Storage

### MVP Storage

For the first version, use local file storage.

Example path:

```text
wwwroot/uploads/class-documents/
```

### Future Storage

Later, move uploaded documents to cloud storage.

Recommended cloud option:

```text
Azure Blob Storage
```

### Document Metadata

The database should store:

```text
Id
ClassSessionId
UploadedByUserId
Title
Description
FileName
OriginalFileName
FilePath
FileType
FileSize
VisibilityType
UploadedAt
UpdatedAt
IsActive
```

### Secure Download Rule

Do not expose direct file URLs to students.

Avoid this:

```text
/uploads/class-documents/file.pdf
```

Use a secure backend endpoint instead:

```text
GET /api/student/class-documents/{id}/download
```

The backend should check whether the student has permission before returning the file.

---

## 9. Class Document Visibility Rules

Uploaders can choose when a document becomes visible to students.

### Visibility Options

```text
BeforeClass
DuringClass
AfterClass
AlwaysAvailable
```

### Recommended Meaning

| Visibility Type | Meaning |
|---|---|
| BeforeClass | Visible after upload until the class starts |
| DuringClass | Visible only between class start time and end time |
| AfterClass | Visible after the class ends or after teacher marks it completed |
| AlwaysAvailable | Visible any time after upload |

### Recommended Access Checks

When a student requests a document, check:

1. Student is enrolled in the related course.
2. Document is active.
3. Visibility timing allows access at the current time.
4. Student has the correct role.

---

## 10. Online Meeting Integration

### MVP Approach

Start with manual meeting links.

The teacher/admin can paste:

- Zoom link
- Google Meet link
- Microsoft Teams link
- Other meeting URL

### Database Fields

```text
Provider
MeetingUrl
MeetingPassword
ExternalMeetingId
StartUrl
StartTime
EndTime
```

### Future Integrations

Later, add:

- Google Calendar API + Google Meet
- Zoom API

Recommended implementation:

```text
IMeetingProvider
GoogleMeetProvider
ZoomMeetingProvider
ManualMeetingProvider
```

This keeps the meeting system flexible and extendable.

---

## 11. Payments Stack

### MVP Approach

Start with manual payment tracking.

Admin can record payments such as:

```text
Cash
Bank Transfer
Card
Online Transfer
```

### Payment Statuses

```text
Pending
Paid
PartiallyPaid
Overdue
Cancelled
```

### Future Payment Integrations

For Sri Lankan usage:

```text
PayHere
```

For international portfolio value:

```text
Stripe
```

---

## 12. Reports Stack

### Recommended Libraries

- QuestPDF
- ClosedXML

### Usage

QuestPDF can be used for:

- PDF receipts
- Student payment reports
- Attendance reports
- Monthly income reports

ClosedXML can be used for:

- Excel exports
- Attendance sheets
- Payment summaries
- Course-wise student reports

---

## 13. Notification Stack

### MVP Approach

Use SMTP email.

### Future Options

- SendGrid
- Mailgun
- WhatsApp Business API
- SMS gateway

### Notification Examples

```text
Class reminder
Payment reminder
New document uploaded
Class cancelled
Attendance marked absent
New announcement
```

---

## 14. Hosting and Deployment

### Local Development

Recommended tools:

```text
Visual Studio 2022
SQL Server Express
SQL Server Management Studio
Postman
Git
GitHub
```

### Production Hosting

Recommended hosting:

| Component | Hosting Option |
|---|---|
| Frontend | Vercel or Azure Static Web Apps |
| Backend | Azure App Service |
| Database | Azure SQL |
| File Storage Later | Azure Blob Storage |

### Simple Deployment Option

For the first deployment, host both frontend and backend using Azure services.

```text
React frontend: Vercel or Azure Static Web Apps
ASP.NET Core API: Azure App Service
Database: Azure SQL
```

---

## 15. Version Control and CI/CD

### Version Control

Use:

```text
Git + GitHub
```

### Recommended Branches

```text
main
develop
feature/auth
feature/student-management
feature/course-management
feature/documents
```

### Future CI/CD

Use GitHub Actions for:

- Build validation
- Test execution
- Backend deployment
- Frontend deployment

---

## 16. Final Recommended Stack

```text
Frontend:
React + TypeScript + Tailwind CSS + shadcn/ui

Backend:
ASP.NET Core Web API

Database:
SQL Server + Entity Framework Core

Authentication:
ASP.NET Core Identity + JWT

File Storage:
Local storage first, Azure Blob Storage later

Reports:
QuestPDF + ClosedXML

Notifications:
SMTP first, SendGrid later

Meetings:
Manual Zoom/Google Meet links first, API integration later

Payments:
Manual payment tracking first, PayHere/Stripe later

Hosting:
Azure App Service + Azure SQL

Version Control:
Git + GitHub
```

---

## 17. Suggested Full Project Structure

```text
ClassFlow/
│
├── classflow-api/
│   ├── Controllers/
│   ├── Services/
│   ├── Repositories/
│   ├── Data/
│   ├── Entities/
│   ├── DTOs/
│   ├── Helpers/
│   ├── Middlewares/
│   └── Program.cs
│
├── classflow-web/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── routes/
│   ├── types/
│   └── main.tsx
│
└── docs/
    ├── requirements.md
    └── technical-stack.md
```

---

## 18. MVP Stack Decision

For the first version, use this stack:

```text
React
TypeScript
Tailwind CSS
shadcn/ui
ASP.NET Core Web API
SQL Server
Entity Framework Core
ASP.NET Core Identity
JWT Authentication
Local file storage
SMTP email
GitHub
```

This stack is enough to build a strong first version of the Online Class Management System.
