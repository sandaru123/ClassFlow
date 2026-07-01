# AGENTS.md

## Project Overview

This project is an **Online Class Management System** called **ClassFlow**.

ClassFlow helps teachers and institutes manage students, courses, class schedules, attendance, payments, online class links, and class documents from one web application.

The project should be developed in phases. **Phase 1 is the MVP/core system. Phase 2 contains advanced features and integrations.**

---

## Main Documentation

Before implementing or modifying features, refer to the project documentation inside the `docs/` folder:

- `docs/requirements.md`
- `docs/tech-stack.md`
- `docs/ui-ux.md`

Use these documents as the main source of truth for requirements, technical decisions, and UI/UX direction.

---

## Tech Stack

### Backend

- ASP.NET Core Web API
- C#
- Entity Framework Core
- SQL Server
- ASP.NET Core Identity
- JWT Authentication

### Frontend

- React
- TypeScript
- Tailwind CSS
- shadcn/ui or reusable component-based UI
- React Router
- Axios or a centralized API client
- React Query if useful for API state management

### Storage

- Local file storage for Phase 1
- Azure Blob Storage can be added in Phase 2

### Reports

- QuestPDF for PDF generation later
- ClosedXML for Excel exports later

---

## Development Rules

- Implement **Phase 1 features first**.
- Do **not** implement Phase 2 features unless explicitly requested.
- Keep changes small, focused, and easy to review.
- Do not generate the whole system in one task.
- Work module by module.
- Prefer simple, maintainable code over over-engineered solutions.
- Use clear folder structure.
- Use DTOs for API requests and responses.
- Keep business logic inside services, not directly inside controllers.
- Use role-based authorization for protected features.
- Do not expose uploaded file paths directly to students.
- Use secure backend download endpoints for class documents.
- Add validation for important request models.
- Avoid adding unnecessary libraries.
- Avoid Phase 2 integrations during MVP work.

---

## Phase 1 Scope

Phase 1 is the MVP version of ClassFlow.

### Phase 1 Features

1. Authentication and role-based access
2. Admin dashboard
3. Student management
4. Teacher management if needed for MVP
5. Course management
6. Student enrollment into courses
7. Class session scheduling
8. Manual Zoom or Google Meet link support
9. Attendance management
10. Manual payment tracking
11. Class document upload
12. Class document visibility control
13. Student portal
14. Basic announcements
15. Basic reports or summary views

---

## Phase 2 Scope

Phase 2 contains advanced features. Do not implement these unless specifically requested.

### Phase 2 Features

- Google Meet API integration
- Zoom API integration
- Google Calendar integration
- Online payment gateway integration
- PayHere or Stripe integration
- Parent portal
- Email automation
- SMS or WhatsApp notifications
- Advanced reports
- PDF receipts
- Excel exports
- Assignment submission
- Teacher availability management
- Advanced calendar scheduling
- Class recording links
- Cloud file storage
- Audit logs
- Analytics dashboard
- PWA/mobile app experience

---

## User Roles

The system may include these roles:

- SuperAdmin
- Admin
- Teacher
- Student
- Parent

For Phase 1, prioritize:

- Admin
- Teacher
- Student

Parent can be added in Phase 2 unless explicitly requested earlier.

---

## Role Permissions

### Admin

Admin can:

- Manage students
- Manage teachers
- Manage courses
- Assign students to courses
- Create and edit class sessions
- Add manual Zoom or Google Meet links
- Upload and manage class documents
- Manage attendance
- Record payments
- View dashboards and reports

### Teacher

Teacher can:

- View assigned courses
- View assigned class sessions
- Upload documents for their own classes
- Edit document visibility
- Mark attendance
- Mark classes as completed

### Student

Student can:

- View enrolled courses
- View upcoming and completed classes
- Join online classes using available links
- View allowed class documents
- Download allowed class documents
- View attendance records
- View payment status
- View announcements

Student cannot:

- Access admin pages
- Upload documents
- View documents for courses they are not enrolled in
- View locked documents
- Access direct file paths

---

## Important Business Rules

### Class Sessions

A class session belongs to a course.

A class session may have:

- Title
- Course
- Teacher
- Start date/time
- End date/time
- Mode: Physical, Online, or Hybrid
- Meeting provider: Manual, Zoom, Google Meet, or Other
- Meeting URL
- Meeting password if needed
- Status: Scheduled, Ongoing, Completed, or Cancelled

For Phase 1, only manual meeting links are required.

---

## Class Document Rules

Class documents are uploaded by an admin or teacher and attached to a class session.

Each document should have:

- Title
- Description
- Class session
- Uploaded by user
- Original file name
- Stored file name
- File path or storage reference
- File type
- File size
- Visibility type
- Uploaded date
- Updated date
- Active/inactive status

### Document Visibility Types

Support these visibility options:

1. Available Immediately
2. Available Before Class
3. Available During Class
4. Available After Class
5. Available After Teacher Marks Completed

### Student Document Access Rule

Students can access a document only if:

1. The student is authenticated.
2. The student is enrolled in the related course.
3. The document is active.
4. The document visibility rule allows access at the current time.

### Visibility Behavior

- **Available Immediately**: available after upload.
- **Available Before Class**: available before the class starts.
- **Available During Class**: available only between class start time and class end time.
- **Available After Class**: available after the class end time.
- **Available After Teacher Marks Completed**: available only after the class status becomes Completed.

Use server-side checks before returning any file.

Do not rely only on frontend hiding.

---

## File Upload Security Rules

- Validate file size.
- Validate allowed file types.
- Store files with safe generated names.
- Keep original file name in the database for display.
- Do not expose physical file paths.
- Use an API endpoint to download files.
- Check student permission before returning a file.
- Admins and teachers can view/manage uploaded files based on their permission.

Recommended download route example:

```text
GET /api/class-documents/{documentId}/download
```

---

## Suggested Backend Structure

```text
classflow-api/
├── Controllers/
├── Data/
├── DTOs/
├── Entities/
├── Enums/
├── Helpers/
├── Interfaces/
├── Middleware/
├── Services/
├── Repositories/
├── Migrations/
├── appsettings.json
└── Program.cs
```

Use services for business logic.

Example services:

- AuthService
- StudentService
- CourseService
- ClassSessionService
- AttendanceService
- PaymentService
- ClassDocumentService
- AnnouncementService

---

## Suggested Frontend Structure

```text
classflow-web/
├── src/
│   ├── api/
│   ├── assets/
│   ├── components/
│   ├── features/
│   ├── hooks/
│   ├── layouts/
│   ├── pages/
│   ├── routes/
│   ├── types/
│   ├── utils/
│   └── main.tsx
└── package.json
```

Use reusable components where possible.

Recommended layouts:

- AuthLayout
- AdminLayout
- TeacherLayout
- StudentLayout

---

## UI/UX Direction

The UI should feel like a clean SaaS-style dashboard.

General style:

- Simple and modern
- Clear sidebar navigation
- Dashboard cards
- Tables with search and filters
- Status badges
- Clean forms
- Confirmation modals for destructive actions
- Mobile-friendly student portal

Important UI elements:

- Admin dashboard cards
- Student management table
- Course detail tabs
- Class session cards
- Attendance marking table
- Payment tracking table
- Document upload form
- Student document list with locked/available states

---

## API Design Guidelines

- Use REST-style endpoints.
- Keep controller actions simple.
- Return DTOs, not EF entities directly.
- Validate input models.
- Return proper HTTP status codes.
- Use pagination for large lists.
- Use filtering for tables where useful.

Example routes:

```text
POST   /api/auth/login
GET    /api/students
POST   /api/students
GET    /api/courses
POST   /api/courses
GET    /api/class-sessions
POST   /api/class-sessions
POST   /api/class-sessions/{id}/documents
GET    /api/student/courses
GET    /api/student/class-sessions/{id}/documents
GET    /api/class-documents/{id}/download
```

---

## Database Guidelines

Use Entity Framework Core with SQL Server.

Important entities:

- ApplicationUser
- Student
- Teacher
- Course
- Enrollment
- ClassSession
- ClassDocument
- AttendanceRecord
- Payment
- Announcement

Use enums for:

- User roles where appropriate
- Class session status
- Class mode
- Payment status
- Attendance status
- Document visibility type

---

## Testing Guidelines

When adding business logic, especially for document access, add tests where practical.

Important logic to test:

- Student enrollment access
- Document visibility rules
- Class status rules
- Payment status calculation
- Attendance status handling

---

## What Not To Do Unless Requested

Do not implement these during Phase 1 unless explicitly requested:

- Zoom OAuth
- Google OAuth
- Google Meet API
- Google Calendar API
- Stripe payments
- PayHere payments
- SMS gateway
- WhatsApp API
- Azure Blob Storage
- Advanced analytics
- Parent portal
- Mobile app
- Complex multi-tenant architecture

---

## Recommended Work Order

Build the project in this order:

1. Backend project setup
2. Frontend project setup
3. Authentication and roles
4. Core entities and database context
5. Student management
6. Course management
7. Enrollment management
8. Class session management
9. Manual meeting link support
10. Class document upload and visibility rules
11. Attendance management
12. Payment tracking
13. Student dashboard
14. Admin dashboard
15. Basic announcements
16. Polish UI and validation

---

## Coding Style

- Use clear names.
- Keep methods small.
- Avoid duplicate logic.
- Use async/await for database and file operations.
- Keep frontend components readable.
- Avoid mixing API calls directly inside many components; use API service functions.
- Add comments only when the logic is not obvious.

---

## Final Reminder

Always prioritize the Phase 1 MVP.

The goal is to build a clean, working Online Class Management System first. Advanced integrations can be added later after the core system is stable.
