# ClassFlow Project Handoff

## Project Name

**ClassFlow**

## Project Summary

ClassFlow is an Online Class Management System for teachers, institutes, and students.

The system helps manage:

- Students
- Teachers
- Courses
- Enrollments
- Class sessions
- Attendance
- Payments
- Class documents/study materials
- Student portal
- Teacher portal
- Admin dashboard

The project is being developed as a full-stack web application using:

- **Backend:** ASP.NET Core Web API
- **Frontend:** React + TypeScript + Vite
- **Database:** SQL Server + Entity Framework Core
- **Authentication:** ASP.NET Core Identity + JWT + Refresh Tokens
- **UI:** Tailwind CSS
- **API Testing:** Swagger

---

## Repository Structure

Current intended structure:

```text
D:\ClassFlow
│
├── ClassFlow.sln
├── ClassFlow.Api
│   └── ASP.NET Core Web API backend
│
├── classflow-web
│   └── React + TypeScript frontend
│
├── docs
│   ├── requirements.md
│   ├── tech-stack.md
│   └── ui-ux.md
│
├── AGENTS.md
├── HANDOFF.md
└── README.md
```

The `.sln` file should stay in the project root, not inside the API folder.

---

## Important Documentation Files

These files were created earlier and should be kept in the repo:

```text
docs/requirements.md
docs/tech-stack.md
docs/ui-ux.md
AGENTS.md
```

`AGENTS.md` is used to guide Codex. It tells Codex to focus on Phase 1 first and avoid jumping into Phase 2 features.

---

## Phase 1 Scope

Phase 1 is the MVP/core system.

Main Phase 1 modules:

- Authentication and roles
- Admin dashboard
- Student management
- Teacher management
- Course management
- Enrollment management
- Class session management
- Attendance management
- Payment tracking
- Document upload/view/download
- Document visibility rules
- Student portal
- Teacher portal
- React frontend pages for all core modules

Phase 2 contains advanced features like Zoom/Google Meet API integration, online payments, SMS/email automation, parent portal, cloud storage, and advanced reports.

---

## Completed Backend Work

The backend is mostly complete for Phase 1.

Completed:

- Backend ASP.NET Core Web API skeleton
- Folder structure:
  - Controllers
  - Services
  - Repositories
  - Data
  - Entities
  - DTOs
  - Helpers
  - Middlewares
- EF Core entities and enums
- DbContext relationships
- SQL Server setup
- Initial EF Core migration
- Swagger/OpenAPI setup
- Swagger JWT Bearer support
- Fixed Swagger package version mismatch
- ASP.NET Core Identity setup
- JWT authentication
- Refresh token support
- Role seeding
- Default SuperAdmin user seeding
- Student Management API
- Teacher Management API
- Course Management API
- Enrollment Management API
- Class Session Management API
- Attendance Management API
- Payment Management API
- Class Document Upload API
- Document visibility/access rules
- Secure document download API
- Student Portal APIs
- Teacher Portal APIs
- Dashboard Summary APIs

---

## Completed Frontend Work

Frontend was started using React + TypeScript + Vite + Tailwind CSS.

Completed:

- React frontend skeleton
- Vite setup
- Tailwind setup
- Base folder structure:
  - src/api
  - src/assets
  - src/components
  - src/components/layout
  - src/features
  - src/hooks
  - src/pages
  - src/routes
  - src/types
  - src/utils
- App layout
- Sidebar
- Topbar
- Routing
- Login page
- Authentication flow
- Access token storage
- Refresh token handling
- Axios interceptor
- Protected routes
- Role-based redirects
- Admin dashboard integration
- Students page integration
- Teachers page integration
- Courses page integration
- Enrollments page integration
- Class Sessions page integration
- Attendance page integration
- Payments page integration
- Documents upload/view page integration
- Student Portal frontend integration
- Teacher Portal frontend integration

---

## Current Estimated Progress

Approximate progress:

```text
Backend Phase 1: 85%–90%
Frontend Phase 1: 70%–80%
Overall Phase 1: 75%–80%
Full product including Phase 2: 45%–55%
```

The backend is mostly done. The remaining work is mainly refinement, UX improvements, updated requirements, testing, and cleanup.

---

## Key Technical Decisions

### Authentication

Authentication uses:

- ASP.NET Core Identity
- JWT access tokens
- Refresh tokens
- Role-based authorization

Roles:

```text
SuperAdmin
Admin
Teacher
Student
Parent
```

Parent role exists but is mostly Phase 2.

### Student and Teacher Login Accounts

Important decision:

When admin creates a student or teacher, the system should also be able to create a linked login account.

The structure should be:

```text
ApplicationUser
    ↓
Student
```

and:

```text
ApplicationUser
    ↓
Teacher
```

Admin create forms should support:

- Email
- CreateLoginAccount checkbox
- TemporaryPassword

If `CreateLoginAccount = true`, backend creates an Identity user, assigns the correct role, and links it to the Student/Teacher record.

Student and Teacher portal APIs must use the logged-in ApplicationUserId to find the linked Student/Teacher profile.

---

## Document Visibility Rules

Documents are uploaded against class sessions.

Document visibility options:

```text
AvailableImmediately
BeforeClass
DuringClass
AfterClass
AfterTeacherMarksCompleted
```

Rules:

- Students can only access documents for courses they are enrolled in.
- Students can only download active documents.
- Documents must be downloaded through the backend API.
- Do not expose direct file paths.
- Admin/Teacher can upload, edit, deactivate, reactivate, or delete documents depending on the final rules.
- Local file storage is used for MVP.

---

## Recent Change Request

A new requirement change was requested.

### Change 1: Delete, deactivate, reactivate, delete forever

Teachers, students, courses, enrollments, class sessions, documents, payments, etc. should support:

- Deactivate/inactivate
- Reactivate/re-enable
- Delete forever where safe

Important:

- Records with related child data should generally not be hard deleted.
- If a record has related data, backend should prevent permanent delete and return a clear message.
- If a record has no related data, permanent delete can be allowed.
- For documents, permanent delete should also remove the physical uploaded file from local storage if safe.
- UI should show:
  - Active
  - Inactive
  - Completed
  - Cancelled
- UI should include:
  - Deactivate
  - Reactivate
  - Delete Forever
- Delete Forever must show a confirmation modal.

### Change 2: Course-centered workflow

The UX should be changed so Course is the main topic.

Current issue:

Courses, sessions, and documents are separate pages.

New workflow:

```text
Course
  └── Sessions
        └── Documents
```

Expected frontend flow:

- Admin goes to Courses
- Clicks a course
- Opens CourseDetailsPage
- CourseDetailsPage has tabs/sections:
  - Overview
  - Enrollments/Students
  - Sessions
  - Payments if useful
- Inside Sessions:
  - Add session
  - Edit session
  - Cancel session
  - Complete session
  - View session details
- Inside Session Details:
  - Upload document
  - View documents
  - Edit document metadata
  - Download/view document
  - Delete/deactivate/reactivate document

Preferred routes:

```text
/admin/courses
/admin/courses/:courseId
/admin/courses/:courseId/sessions/:sessionId

/teacher/courses
/teacher/courses/:courseId
/teacher/courses/:courseId/sessions/:sessionId
```

Separate Class Sessions/Documents pages may remain if useful, but main workflow should be course-centered.

### Change 3: Documents inside sessions

Uploaded documents should be visible inside the selected session.

Session document UI should show:

- Title
- Original file name
- Visibility type
- Uploaded date
- Status
- File size

Actions:

- Upload
- Edit metadata
- Download/View
- Deactivate
- Reactivate
- Delete Forever

Do not expose direct file paths. Use secure download endpoint.

If backend does not already have admin/teacher download endpoint, add:

```text
GET /api/class-documents/{documentId}/download
```

### Change 4: Payment UX improvements

Payment form dropdowns should be searchable.

Payment forms should use searchable dropdowns for:

- Student
- Course

Search by:

- Student name
- Student email
- Course name

When student is selected, course dropdown should optionally show only courses where the student is actively enrolled.

Payment list should show tabs/filters:

- All Payments
- Pending Payments
- Unpaid Payments
- Partially Paid Payments
- Paid Payments
- Overdue Payments if supported

Need a clear pending/unpaid payment list.

Payment statuses should be clear:

```text
Paid
Pending
Unpaid
PartiallyPaid
Overdue
Cancelled
```

If backend does not support `Unpaid`, update enum and logic safely.

Useful endpoints:

```text
GET /api/payments/pending
GET /api/payments/unpaid
```

Payment business rules:

- Amount must not be negative.
- PaidAmount must not be negative.
- PaidAmount should not exceed Amount unless overpayment is intentionally allowed.
- If PaidAmount = 0 and Amount > 0, status should be Pending or Unpaid depending on enum design.
- If PaidAmount < Amount, status should be PartiallyPaid.
- If PaidAmount >= Amount, status should be Paid.
- BalanceAmount should always be calculated correctly.

---

## Recommended Next Work Order

Because the recent change is large, do not ask Codex to do everything at once.

Use this order:

1. Delete/deactivate/reactivate/delete forever behavior
2. Course-centered UI and route changes
3. Session details page with documents inside session
4. Payment searchable dropdowns and pending/unpaid list
5. Final backend/frontend cleanup
6. Full testing
7. README update
8. Phase 1 demo polish

---

## Next Codex Prompt 1: Delete / Reactivate / Delete Forever

Use this first:

```text
Read AGENTS.md, docs/requirements.md, docs/tech-stack.md, and docs/ui-ux.md.

Implement only CHANGE REQUEST 1: Delete, deactivate, reactivate, and delete forever behavior.

Requirements:
1. Inspect current backend entities, services, and controllers.
2. Do not rewrite the whole project.
3. Add or standardize soft delete/inactive behavior for:
   - Students
   - Teachers
   - Courses
   - Enrollments
   - ClassSessions
   - ClassDocuments
   - Payments

4. Add Reactivate/Enable endpoints where missing.
5. Add Delete Forever endpoints where safe.
6. If a record has related child data, prevent hard delete and return a clear user-friendly error.
7. If a record has no related child data, allow permanent delete.
8. For ClassDocuments, permanent delete should also remove the physical uploaded file if safe.
9. Update frontend tables/lists to show status badges.
10. Add UI actions:
    - Deactivate
    - Reactivate
    - Delete Forever
11. Delete Forever must use a confirmation modal.
12. Add Active/Inactive/All filters where useful.
13. Do not implement the course-centered UI yet.
14. Do not implement payment dropdown changes yet.
15. Do not add Phase 2 features.
16. Add EF Core migration if entity changes are required.
17. Run dotnet build.
18. Run npm run build.
19. Fix all build errors.
```

After Codex finishes:

```powershell
cd D:\ClassFlow\ClassFlow.Api
dotnet build
dotnet ef migrations add AddReactivateAndSafePermanentDelete
dotnet ef database update

cd D:\ClassFlow\classflow-web
npm run build

cd D:\ClassFlow
git add .
git commit -m "Add deactivate reactivate and safe permanent delete"
```

---

## Next Codex Prompt 2: Course-Centered UI

Use after Prompt 1 is complete:

```text
Read AGENTS.md, docs/requirements.md, docs/tech-stack.md, and docs/ui-ux.md.

Implement only CHANGE REQUEST 2: Course-centered workflow.

Requirements:
1. Course should become the main workflow.
2. Update CoursesPage so clicking a course opens CourseDetailsPage.
3. Add CourseDetailsPage route:
   - /admin/courses/:courseId

4. CourseDetailsPage should show:
   - Overview
   - Enrolled students/enrollments
   - Sessions
   - Payments if simple and already supported

5. In the Sessions section:
   - Show sessions for the selected course
   - Add session
   - Edit session
   - Cancel session
   - Complete session
   - View session details

6. Add SessionDetailsPage or expandable section:
   - /admin/courses/:courseId/sessions/:sessionId

7. Do not remove existing Class Sessions page unless it causes issues.
8. Reuse existing class session APIs and services.
9. Add helper endpoints only if required.
10. Do not implement payment dropdown changes.
11. Do not add Phase 2 features.
12. Run dotnet build and npm run build.
```

Commit:

```powershell
cd D:\ClassFlow
git add .
git commit -m "Add course centered session workflow"
```

---

## Next Codex Prompt 3: Documents Inside Sessions

Use after Prompt 2:

```text
Read AGENTS.md, docs/requirements.md, docs/tech-stack.md, and docs/ui-ux.md.

Implement only CHANGE REQUEST 3: Documents inside session details.

Requirements:
1. In CourseDetailsPage or SessionDetailsPage, show uploaded documents for the selected session.
2. Allow admin/teacher to upload documents from inside the session.
3. Allow editing document metadata:
   - Title
   - Description
   - VisibilityType

4. Show document list with:
   - Title
   - Original file name
   - Visibility type
   - Uploaded date
   - Status
   - File size

5. Add actions:
   - Download/View
   - Deactivate
   - Reactivate
   - Delete Forever

6. Use secure backend download endpoint.
7. Do not expose direct file paths.
8. If backend lacks admin/teacher document download endpoint, add:
   - GET /api/class-documents/{documentId}/download

9. Do not implement document preview.
10. Do not implement Azure Blob Storage.
11. Do not add Phase 2 features.
12. Run dotnet build and npm run build.
```

Commit:

```powershell
cd D:\ClassFlow
git add .
git commit -m "Manage documents inside class sessions"
```

---

## Next Codex Prompt 4: Payment Searchable Dropdowns and Unpaid List

Use after Prompt 3:

```text
Read AGENTS.md, docs/requirements.md, docs/tech-stack.md, and docs/ui-ux.md.

Implement only CHANGE REQUEST 4: Payment searchable dropdowns and pending/unpaid payment list improvements.

Requirements:
1. Update payment create/edit form with searchable dropdowns for:
   - Student
   - Course

2. Search should support:
   - Student name
   - Student email
   - Course name

3. When a student is selected, filter course dropdown to courses where the student has an active enrollment if simple to implement.
4. Add payment list tabs or filters:
   - All Payments
   - Pending Payments
   - Unpaid Payments
   - Partially Paid Payments
   - Paid Payments
   - Overdue Payments if supported

5. Add a clear pending/unpaid payment list section.
6. Add or update backend endpoint if needed:
   - GET /api/payments/unpaid

7. Keep GET /api/payments/pending working.
8. If backend PaymentStatus enum does not support Unpaid, update it safely.
9. Make sure payment calculation rules are correct:
   - PaidAmount = 0 and Amount > 0 => Pending or Unpaid
   - PaidAmount < Amount => PartiallyPaid
   - PaidAmount >= Amount => Paid
   - BalanceAmount = Amount - PaidAmount

10. Do not allow negative Amount or PaidAmount.
11. Do not implement online payment gateway.
12. Do not implement receipts.
13. Do not add Phase 2 features.
14. Run dotnet build and npm run build.
```

Commit:

```powershell
cd D:\ClassFlow
git add .
git commit -m "Improve payment dropdowns and unpaid payment lists"
```

---

## Useful Commands

### Backend

```powershell
cd D:\ClassFlow\ClassFlow.Api
dotnet build
dotnet run
dotnet ef migrations add MigrationName
dotnet ef database update
```

### Frontend

```powershell
cd D:\ClassFlow\classflow-web
npm install
npm run dev
npm run build
```

### Git

```powershell
cd D:\ClassFlow
git status
git add .
git commit -m "Commit message"
```

---

## Testing Checklist

Before moving to Phase 2, test these flows:

### Admin

- Login as SuperAdmin/Admin
- Create teacher with login account
- Create student with login account
- Create course
- Enroll student into course
- Create class session inside course
- Upload document inside session
- Edit document visibility
- Download document
- Deactivate and reactivate records
- Try Delete Forever on records with and without child data
- Create payment
- Record partial payment
- Record full payment
- View pending/unpaid payments

### Teacher

- Login as teacher
- View own dashboard
- View assigned courses
- View course sessions
- View students in own courses
- View/upload/manage documents if allowed
- View attendance related to own sessions

### Student

- Login as student
- View own dashboard
- View enrolled courses
- View schedule
- Join/view meeting link
- View available documents
- Confirm locked documents show proper messages
- View payments
- View attendance

---

## Known Important Rules

- Do not expose uploaded file paths directly.
- Always download files through secure backend endpoints.
- Do not let students pass another StudentId to view someone else's data.
- Student portal must use logged-in user's linked Student record.
- Teacher portal must use logged-in user's linked Teacher record.
- Hard delete should be safe and should not break relationships.
- Prefer soft delete/inactive status for records with related data.
- Use React Query for frontend server state.
- Use existing Axios client and auth interceptor.
- Keep Phase 2 out until Phase 1 is stable.

---

## Phase 2 Ideas Not Yet Implemented

Do not implement these unless explicitly requested later:

- Google Meet API integration
- Zoom API integration
- Online payment gateway
- PayHere/Stripe integration
- Email invitation flow
- Password reset flow
- Parent portal
- SMS/WhatsApp reminders
- Azure Blob Storage
- Document preview
- Advanced reports
- PDF receipts
- Excel exports
- PWA/mobile app
