# ClassFlow

ClassFlow is a Phase 1 online class management system for institutes, teachers, and students. The current MVP focuses on the core operational workflow for managing users, courses, enrollments, class sessions, attendance, payments, and secure class documents from one web application.

## Project Overview

Phase 1 is the core MVP for ClassFlow. The project is built as a full-stack web application with:

- a role-based ASP.NET Core Web API backend
- a React + TypeScript frontend
- SQL Server persistence through Entity Framework Core
- secure JWT authentication with refresh tokens
- separate portal experiences for admins, teachers, and students

The current implementation is centered on Phase 1 business needs:

- student and teacher account management
- course and enrollment management
- class session scheduling with manual online meeting links
- attendance tracking
- manual payment tracking
- class document upload, visibility control, and secure download
- dashboard views for operational summaries

Supported roles in the current project:

- `SuperAdmin`
- `Admin`
- `Teacher`
- `Student`

## Tech Stack

### Backend

- ASP.NET Core Web API
- C#
- .NET 8
- Entity Framework Core
- SQL Server
- ASP.NET Core Identity
- JWT authentication
- Swagger / OpenAPI

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- TanStack React Query

### Storage

- Local file storage for Phase 1 class documents

## Completed Phase 1 Features

The current repository supports these implemented or integrated Phase 1 areas:

- Authentication with JWT access tokens and refresh tokens
- Role seeding and default SuperAdmin seeding
- Role-based route and API protection
- Admin dashboard
- Student management
- Teacher management
- Course management
- Enrollment management
- Class session scheduling and status updates
- Manual Zoom / Google Meet / other meeting link fields
- Attendance management
- Manual payment tracking
- Class document upload
- Class document metadata updates
- Document deactivate / reactivate / safe permanent delete behavior
- Secure document download endpoints
- Student portal:
  - dashboard
  - enrolled courses
  - schedule
  - available documents
  - payments
  - attendance
- Teacher portal:
  - dashboard
  - assigned courses
  - assigned sessions
  - student list
  - attendance
  - documents
- Course-centered workflow routes:
  - `/admin/courses`
  - `/admin/courses/:courseId`
  - `/admin/courses/:courseId/sessions/:sessionId`
  - `/teacher/courses`
  - `/teacher/courses/:courseId`
  - `/teacher/courses/:courseId/sessions/:sessionId`

## Current Folder Structure

```text
ClassFlow/
|-- AGENTS.md
|-- HANDOFF.md
|-- README.md
|-- ClassFlow.slnx
|-- docs/
|   |-- requirements.md
|   |-- tech-stack.md
|   `-- ui-ux.md
|-- classflow-api/
|   |-- Controllers/
|   |-- Data/
|   |-- DTOs/
|   |-- Entities/
|   |-- Enums/
|   |-- Helpers/
|   |-- Interfaces/
|   |-- Migrations/
|   |-- Properties/
|   |-- Services/
|   |-- wwwroot/
|   |-- appsettings.example.json
|   |-- appsettings.json
|   |-- ClassFlow.Api.csproj
|   `-- Program.cs
`-- classflow-web/
    |-- public/
    |-- src/
    |   |-- api/
    |   |-- assets/
    |   |-- components/
    |   |-- features/
    |   |-- hooks/
    |   |-- pages/
    |   |-- routes/
    |   |-- types/
    |   `-- utils/
    |-- .env.example
    |-- index.html
    |-- package.json
    |-- tsconfig.app.json
    |-- tsconfig.json
    `-- vite.config.ts
```

## Backend Setup and Run

1. Open `classflow-api/appsettings.example.json`.
2. Copy the values into `classflow-api/appsettings.json` or update the existing file.
3. Configure:
   - SQL Server connection string
   - JWT issuer, audience, and signing key
   - seeded SuperAdmin values
4. Apply database migrations.
5. Run the API.

### Commands

```powershell
cd D:\ClassFlow\classflow-api
dotnet restore
dotnet build
dotnet run
```

### Swagger

When the API runs in development, Swagger is available from the API host, typically:

```text
https://localhost:<api-port>/swagger
```

## Frontend Setup and Run

1. Copy `classflow-web/.env.example` to `classflow-web/.env` if needed.
2. Set `VITE_API_BASE_URL` to the running API base URL.
3. Install dependencies.
4. Start the Vite development server.

### Commands

```powershell
cd D:\ClassFlow\classflow-web
npm install
npm run dev
```

### Production Build

```powershell
cd D:\ClassFlow\classflow-web
npm run build
```

## Database Migration and Update Commands

Use these commands from the API project directory.

### Apply existing migrations

```powershell
cd D:\ClassFlow\classflow-api
dotnet ef database update
```

### Add a new migration

```powershell
cd D:\ClassFlow\classflow-api
dotnet ef migrations add YourMigrationName
dotnet ef database update
```

## Default SuperAdmin Login Configuration Notes

The application seeds the `SuperAdmin` role and a default SuperAdmin user on startup through the backend seeding flow.

The current development configuration in `classflow-api/appsettings.json` is:

```json
"SeedUsers": {
  "SuperAdmin": {
    "Email": "superadmin@classflow.local",
    "Password": "SuperAdmin123!",
    "FirstName": "Super",
    "LastName": "Admin"
  }
}
```

Important notes:

- Treat the current password as a local development default only.
- Change the password before using the project outside local development.
- The seeded values can be changed through `appsettings.json`.
- If the configured user does not exist, startup seeding creates it automatically.

## Environment Variables for API and Frontend

### Backend Configuration

The backend primarily uses `classflow-api/appsettings.json` and `classflow-api/appsettings.example.json`.

Main configuration keys:

- `ConnectionStrings:DefaultConnection`
- `Jwt:Issuer`
- `Jwt:Audience`
- `Jwt:Key`
- `Jwt:ExpiryMinutes`
- `Jwt:RefreshTokenExpiryDays`
- `SeedUsers:SuperAdmin:Email`
- `SeedUsers:SuperAdmin:Password`
- `SeedUsers:SuperAdmin:FirstName`
- `SeedUsers:SuperAdmin:LastName`

Example:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=ClassFlowDb;Trusted_Connection=True;TrustServerCertificate=True;"
  },
  "Jwt": {
    "Issuer": "ClassFlow.Api",
    "Audience": "ClassFlow.Api",
    "Key": "REPLACE_WITH_A_LONG_RANDOM_SECRET_KEY_AT_LEAST_32_CHARS",
    "ExpiryMinutes": 120,
    "RefreshTokenExpiryDays": 30
  },
  "SeedUsers": {
    "SuperAdmin": {
      "Email": "superadmin@classflow.local",
      "Password": "REPLACE_WITH_A_STRONG_PASSWORD",
      "FirstName": "Super",
      "LastName": "Admin"
    }
  }
}
```

### Frontend Environment Variables

The frontend currently uses:

```env
VITE_API_BASE_URL=https://localhost:YOUR_API_PORT/api
```

This value is defined in `classflow-web/.env.example`.

## Testing Checklist

Use this checklist before treating the current Phase 1 build as stable.

### Authentication and roles

- Log in as `SuperAdmin`
- Log in as `Admin`
- Log in as `Teacher`
- Log in as `Student`
- Confirm role-based navigation and route protection work correctly

### Admin flow

- Create a teacher with a login account
- Create a student with a login account
- Create a course
- Enroll a student into a course
- Open the course workspace
- Create a session inside the course
- Open the session workspace
- Upload a class document
- Edit document metadata
- Deactivate and reactivate documents
- Download a document through the secure endpoint
- Record a payment
- Review attendance and payment status badges

### Teacher flow

- Log in as teacher
- View assigned courses
- Open a course workspace
- View assigned sessions
- Open a session workspace
- Manage documents for assigned sessions
- View students in assigned courses
- Review teacher dashboard summaries

### Student flow

- Log in as student
- View enrolled courses
- View schedule
- View available documents
- Confirm restricted documents stay protected by backend rules
- Download an allowed document
- View attendance
- View payment status
- Review student dashboard summaries

### Build verification

- `dotnet build` passes in `classflow-api`
- `npm run build` passes in `classflow-web`

## Phase 2 Roadmap

Phase 2 is intentionally out of scope for the current MVP. Planned roadmap items include:

- Google Meet API integration
- Zoom API integration
- Google Calendar integration
- Online payment gateway integration
- Parent portal
- Email automation
- SMS / WhatsApp notifications
- Advanced reports
- PDF receipts
- Excel exports
- Assignment submission
- Teacher availability management
- Recorded class links
- Cloud file storage such as Azure Blob Storage
- Audit logs
- Analytics dashboard
- PWA / mobile app experience

## Notes

- This repository is currently focused on Phase 1 only.
- Do not expose uploaded file paths directly to students.
- Use secure backend download endpoints for class document access.
- `AGENTS.md`, `HANDOFF.md`, and the `docs/` folder are the main references for ongoing Phase 1 work.
