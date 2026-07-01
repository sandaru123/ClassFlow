# Online Class Management System - Requirements Document

## 1. Project Overview

The Online Class Management System is a web application designed for teachers, tutors, music classes, tuition institutes, and training centers to manage students, courses, online class sessions, attendance, payments, study materials, and class documents from a centralized admin panel.

The system should support both physical and online classes. In Phase 1, teachers can manually add Zoom, Google Meet, or any other meeting link. In Phase 2, the system can be extended with direct Zoom, Google Meet, payment, notification, and advanced learning integrations.

## 2. Main Goal

The main goal is to help teachers and institutes manage classes efficiently through:

- Student management
- Teacher management
- Course and class scheduling
- Online meeting link management
- Attendance tracking
- Payment and fee tracking
- Class document upload and viewing
- Document visibility control based on class timing
- Admin, teacher, student, and parent portals
- Reports and notifications

## 3. User Roles

## 3.1 Super Admin

The Super Admin has full control over the system.

Responsibilities:

- Manage all users
- Manage admins and teachers
- Manage system settings
- View all reports
- Manage all courses and students
- Control system-wide configuration

## 3.2 Admin

The Admin manages daily operations of the institute or class center.

Responsibilities:

- Manage students
- Manage teachers
- Manage courses
- Schedule class sessions
- Manage attendance
- Manage payments
- Upload and manage study materials
- View reports
- Send announcements

## 3.3 Teacher

The Teacher manages assigned courses and class sessions.

Responsibilities:

- View assigned courses
- Schedule or manage class sessions if permission is given
- Upload class documents
- Edit uploaded document details
- Set document visibility rules
- Mark attendance
- Mark class sessions as completed
- View student lists for assigned courses

## 3.4 Student

The Student can view their enrolled courses and access class-related content.

Responsibilities:

- View enrolled courses
- View upcoming classes
- Join online classes
- View available class documents
- Download allowed documents
- View attendance history
- View payment status
- View announcements

## 3.5 Parent

The Parent can monitor the student’s progress and payments.

Responsibilities:

- View student attendance
- View payment status
- View class schedule
- View announcements

Parent portal is planned for Phase 2.

---

# Phase 1 - MVP Requirements

Phase 1 should focus on the core system. The goal is to build a working class management platform without depending on advanced third-party integrations.

## 4. Phase 1 Scope

Phase 1 includes:

1. Authentication and role-based access
2. Admin dashboard
3. Student management
4. Teacher management
5. Course management
6. Student enrollment
7. Class session scheduling
8. Manual Zoom / Google Meet link management
9. Attendance management
10. Manual payment tracking
11. Class document upload
12. Document visibility control
13. Secure document download
14. Student portal
15. Basic announcements
16. Basic reports

## 5. Authentication and Authorization

The system should support secure login and role-based access.

### Requirements

- Users should be able to log in using email and password.
- System should support role-based authorization.
- Admin, teacher, and student users should have different permissions.
- Unauthorized users should not be able to access protected pages or APIs.
- JWT authentication can be used if the frontend is built with React.

### Phase 1 Roles

- SuperAdmin
- Admin
- Teacher
- Student

Parent role can be added in Phase 2.

## 6. Admin Dashboard

The admin dashboard should provide a quick overview of the system.

### Dashboard Cards

- Total students
- Active courses
- Today’s classes
- Pending payments
- Monthly income
- Attendance summary
- Upcoming online classes
- Recent payments

### Example Dashboard Data

- Students: 120
- Active courses: 8
- Today’s classes: 5
- Pending payments: 23
- This month income: Rs. 240,000

## 7. Student Management

The system should allow admins to manage student records.

### Requirements

- Add new student
- Edit student details
- Deactivate student
- Delete student if allowed
- Assign student to one or more courses
- View student profile
- View student attendance history
- View student payment history

### Student Fields

- Full name
- Email
- Phone number
- Parent name
- Parent phone number
- Address
- Registered date
- Status: Active / Inactive

## 8. Teacher Management

The system should allow admins to manage teachers.

### Requirements

- Add teacher
- Edit teacher details
- Assign teacher to courses
- View teacher class schedule
- Activate or deactivate teacher

### Teacher Fields

- Full name
- Email
- Phone number
- Subjects or skills
- Status: Active / Inactive

## 9. Course Management

The system should allow admins to create and manage courses.

### Example Courses

- Grade 6 Eastern Music
- Grade 10 Music Theory
- Beginner Guitar
- Advanced Guitar
- Keyboard Class
- Violin Class

### Requirements

- Create course
- Edit course
- Assign teacher
- Assign students
- Set monthly fee
- Set class type: Physical / Online / Hybrid
- Set course status: Active / Inactive

### Course Fields

- Course name
- Description
- Teacher ID
- Monthly fee
- Class type
- Duration
- Student limit
- Status

## 10. Student Enrollment

The system should allow students to be enrolled in courses.

### Requirements

- Assign student to course
- Remove student from course
- Set enrollment status: Active / Inactive
- View course-wise student list
- View student-wise course list

## 11. Class Session Scheduling

The system should allow admins or teachers to schedule individual class sessions.

### Requirements

- Create class session
- Edit class session
- Cancel class session
- Mark class as ongoing
- Mark class as completed
- Add online meeting link manually
- Select meeting provider
- Add class description

### Class Session Fields

- Course ID
- Teacher ID
- Title
- Description
- Start time
- End time
- Class mode: Physical / Online / Hybrid
- Meeting provider: Zoom / Google Meet / Other / Manual
- Meeting URL
- Meeting password
- Status: Scheduled / Ongoing / Completed / Cancelled

### Online Class Flow

1. Admin or teacher creates a class session.
2. Admin or teacher adds Zoom, Google Meet, or another meeting link manually.
3. Student logs in and views upcoming classes.
4. Student clicks the Join Class button.
5. System may record that the student clicked the join button.

## 12. Manual Online Meeting Link Management

In Phase 1, meeting links should be added manually.

### Supported Fields

- Meeting provider
- Meeting URL
- Meeting password
- Meeting notes

### Requirements

- Teacher/admin can add a meeting link to a class session.
- Student can see the Join Class button only for enrolled classes.
- Student should not see host-only links.
- Meeting links should be editable by admin/teacher.

## 13. Attendance Management

The system should allow teachers or admins to mark attendance for class sessions.

### Attendance Statuses

- Present
- Absent
- Late
- Excused

### Requirements

- Mark attendance by class session
- View attendance by student
- View attendance by course
- Generate monthly attendance report
- Allow teacher/admin to update attendance

### Optional Phase 1 Behavior

The system can record when a student clicks the Join Class button. This can help the teacher mark attendance, but final attendance should still be editable by the teacher.

## 14. Payment and Fee Management

The system should allow admins to track student payments manually.

### Phase 1 Payment Approach

Admin can record:

- Cash payments
- Bank transfers
- Card payments handled outside the system
- Other payment methods

### Payment Statuses

- Paid
- Pending
- Overdue
- Partially Paid

### Requirements

- Set course monthly fee
- Record student payment
- View payment history
- Track unpaid students
- Generate basic payment receipt
- Generate monthly income report

## 15. Class Documents and Study Materials

Teachers or admins should be able to upload documents for a class session. Students should only be able to view or download documents when the selected visibility rule allows it.

### Supported Document Types

- PDF
- Word documents
- Images
- Audio files
- Video links
- Practice sheets
- Assignment files
- Exam papers

### Admin / Teacher Requirements

- Upload document for a class session
- Add title
- Add description
- Select display timing
- Edit document title
- Edit document description
- Edit document display timing
- Delete or deactivate document
- View uploaded documents by class session

### Student Requirements

- View available documents
- Download allowed documents
- See locked documents with availability message
- Search documents by course or class session
- View documents only for enrolled courses

## 16. Document Visibility Control

The uploader should be able to control when the document is visible to students.

### Visibility Options

- Before Class
- During Class
- After Class
- Always Available

### Recommended UI Labels

- Available before class starts
- Available during class only
- Available after class completion
- Always available

## 16.1 Document Visibility Rules

Assume a class session has:

- Start time
- End time
- Status

### Before Class

The document is visible only before the class starts.

Rule:

```text
Current time < Class start time
```

### During Class

The document is visible only while the class is running.

Rule:

```text
Current time >= Class start time
AND
Current time <= Class end time
```

### After Class

The document is visible only after the class is completed.

Recommended rule:

```text
Current time > Class end time
AND
Class status == Completed
```

This prevents students from accessing the document before the teacher officially completes the class.

### Always Available

The document is visible any time after upload.

Rule:

```text
Document is active
```

## 16.2 Locked Document Behavior

Students should be able to see that a document exists, but they should not be able to open or download it until the visibility rule allows it.

### Example Messages

- Available before class starts
- Available when class starts
- Available after class is completed
- This document was only available during class
- Not available yet

## 16.3 Student Document UI Example

```text
Lesson 05 - Beginner Guitar

Available Documents
------------------------------------------------
Basic Chord Sheet.pdf          Download
Practice Audio.mp3             Download

Locked Documents
------------------------------------------------
Lesson Summary.pdf             Available after class is completed
Exam Tips.pdf                  Available during class only
```

## 16.4 Document Security Requirements

Document access must be protected by backend permission checks.

### Important Rule

Do not expose direct public file paths to students.

Avoid this:

```text
/uploads/class-documents/file.pdf
```

Use a secure download endpoint instead:

```text
/api/student/class-documents/{documentId}/download
```

Before returning the file, the backend should check:

1. Student is logged in.
2. Student is enrolled in the related course.
3. Document is active.
4. Visibility rule allows access.
5. File exists in storage.

## 17. Announcements

The system should allow admins or teachers to send basic announcements.

### Example Announcements

- Class cancelled today
- New lesson uploaded
- Exam date changed
- Payment reminder
- Special workshop announcement

### Phase 1 Requirements

- Create announcement
- Assign announcement to course or all students
- Show announcement in student dashboard

Email, SMS, and WhatsApp notifications are planned for Phase 2.

## 18. Basic Reports

Reports help make the admin panel more professional.

### Phase 1 Reports

- Monthly income report
- Pending payment report
- Student attendance report
- Course-wise student count
- Teacher class report
- Active/inactive student report

### Export Options

Basic PDF and Excel export can be added in Phase 1 if time allows. Advanced reporting is planned for Phase 2.

## 19. Phase 1 Suggested Admin Menu

```text
Dashboard
Students
Teachers
Courses
Enrollments
Class Sessions
Attendance
Payments
Class Documents
Announcements
Reports
Settings
```

## 20. Phase 1 Suggested Student Menu

```text
Dashboard
My Courses
Upcoming Classes
Completed Classes
Class Documents
Attendance
Payments
Announcements
Profile
```

---

# Phase 2 - Advanced Features

Phase 2 includes features that improve automation, integrations, communication, learning experience, reporting, and scalability.

## 21. Phase 2 Scope

Phase 2 includes:

1. Google Meet integration
2. Zoom API integration
3. Online payment gateway integration
4. Parent portal
5. Email reminders
6. SMS reminders
7. WhatsApp notifications
8. PDF receipts and advanced reports
9. Excel exports
10. Student assignment submissions
11. Online quizzes
12. Recorded class video links
13. Teacher salary management
14. Multi-branch institute support
15. Cloud file storage
16. Mobile app
17. Audit logs
18. Advanced dashboard analytics

## 22. Google Meet Integration

The system can integrate with Google Calendar and Google Meet.

### Requirements

- Teacher connects Google account.
- System creates Google Calendar event.
- Google generates a Meet link.
- System saves the Meet link.
- Students see Join Google Meet button.
- Calendar invitation can be sent to students if required.

### Google Meet Flow

1. Teacher connects Google account.
2. Teacher schedules a class session.
3. System creates Google Calendar event.
4. Google generates Meet link.
5. System saves meeting details.
6. Students access the Join Google Meet button from their portal.

## 23. Zoom API Integration

The system can integrate with Zoom to create meetings automatically.

### Requirements

- Teacher connects Zoom account.
- System creates Zoom meeting using Zoom API.
- System saves join URL, meeting ID, and password.
- Students see Join Zoom button.
- Admin/teacher can update or cancel the meeting.

### Zoom Flow

1. Teacher connects Zoom account.
2. Teacher schedules a class session.
3. System creates Zoom meeting.
4. System saves join URL, meeting ID, and password.
5. Students join the meeting from the student portal.

## 24. Online Payment Gateway Integration

Phase 2 can include online payments.

### Suggested Gateways

- PayHere
- Stripe
- Bank transfer verification
- Card payment gateway

### Requirements

- Student can pay course fees online.
- System should update payment status automatically after successful payment.
- System should handle failed payments.
- System should handle pending payments.
- System should validate payment gateway webhooks securely.
- Admin can view online payment logs.

## 25. Parent Portal

The Parent portal allows parents to monitor student progress.

### Requirements

- Parent login
- View child class schedule
- View child attendance
- View child payment status
- View announcements
- View basic progress summary

## 26. Notification System

Phase 2 should support automated notifications.

### Notification Types

- Class reminders
- Payment reminders
- New document uploaded
- Class cancelled
- Attendance marked absent
- Assignment deadline reminder

### Channels

- Email
- SMS
- WhatsApp

### Suggested Services

- SMTP / SendGrid for email
- Local SMS gateway or Twilio for SMS
- WhatsApp Business API for WhatsApp messages

## 27. Advanced Reports and Exports

Phase 2 should improve reporting.

### Reports

- Monthly income report
- Course-wise income report
- Pending payment aging report
- Student attendance summary
- Teacher performance report
- Course performance report
- Student progress report
- Branch-wise report if multi-branch support is added

### Export Options

- PDF export
- Excel export

### Suggested Libraries

- QuestPDF for PDF generation
- ClosedXML for Excel export

## 28. Assignment Submission

Students should be able to submit assignments.

### Requirements

- Teacher creates assignment
- Teacher sets deadline
- Student uploads submission
- Teacher reviews submission
- Teacher adds marks or comments
- Student views feedback

## 29. Online Quiz Module

The system can support basic online quizzes.

### Requirements

- Teacher creates quiz
- Add multiple-choice questions
- Add short-answer questions if required
- Set quiz start and end time
- Student attempts quiz
- System calculates marks for auto-gradable questions
- Teacher reviews answers

## 30. Recorded Class Video Links

Teachers can add recorded class links after class completion.

### Requirements

- Add recording URL
- Attach recording to class session
- Restrict recording access to enrolled students
- Set recording availability rules

## 31. Teacher Salary Management

Useful for institutes with multiple teachers.

### Requirements

- Set teacher payment type
- Calculate salary based on fixed amount, class count, or percentage
- Track paid and unpaid teacher salaries
- Generate teacher salary report

## 32. Multi-Branch Institute Support

Useful for larger institutes.

### Requirements

- Create branches
- Assign admins to branches
- Assign teachers to branches
- Assign courses to branches
- Branch-wise student management
- Branch-wise reports

## 33. Cloud File Storage

Move document storage from local server to cloud storage.

### Supported Options

- Azure Blob Storage
- AWS S3
- Google Cloud Storage

### Requirements

- Upload files to cloud storage
- Store file metadata in database
- Serve files through secure backend endpoints
- Do not expose public direct file links unless intentionally configured

## 34. Mobile App

A mobile app can be added later for students and parents.

### Suggested Features

- View upcoming classes
- Join online class
- View documents
- View attendance
- View payments
- Receive push notifications

## 35. Audit Logs

Audit logs help track important actions.

### Requirements

- Log user login
- Log document upload/edit/delete
- Log payment changes
- Log attendance changes
- Log class session status changes
- Log user role changes

## 36. Advanced Dashboard Analytics

Phase 2 dashboard can include charts and deeper insights.

### Examples

- Monthly income chart
- Attendance trend chart
- Course growth chart
- Payment overdue chart
- Student registration trend
- Teacher workload chart

---

# Shared Requirements

These requirements apply to both Phase 1 and Phase 2.

## 37. Suggested Technical Stack

### Frontend

- React
- TypeScript
- Tailwind CSS
- React Router
- React Query
- Axios

### Backend

- ASP.NET Core Web API
- C#
- Entity Framework Core
- ASP.NET Core Identity
- JWT Authentication

### Database

- SQL Server

### File Storage

Phase 1:

- Local server storage

Phase 2:

- Azure Blob Storage
- AWS S3
- Google Cloud Storage

### Reports

- QuestPDF
- ClosedXML

### Notifications

Phase 1:

- Basic in-app announcements

Phase 2:

- SMTP email
- SendGrid
- Mailgun
- SMS
- WhatsApp Business API

### Hosting

Recommended:

- Azure App Service
- Azure SQL Database

Alternative:

- Render
- Railway
- VPS

## 38. Suggested Database Tables

## 38.1 Phase 1 Tables

### Users

Managed using ASP.NET Core Identity.

### Students

- Id
- UserId
- FullName
- Email
- PhoneNumber
- ParentName
- ParentPhoneNumber
- Address
- RegisteredDate
- Status

### Teachers

- Id
- UserId
- FullName
- Email
- PhoneNumber
- Skills
- Status

### Courses

- Id
- Name
- Description
- TeacherId
- MonthlyFee
- ClassType
- Duration
- StudentLimit
- Status
- CreatedAt

### Enrollments

- Id
- StudentId
- CourseId
- EnrolledAt
- Status

### ClassSessions

- Id
- CourseId
- TeacherId
- Title
- Description
- StartTime
- EndTime
- ClassMode
- MeetingProvider
- MeetingUrl
- MeetingPassword
- Status
- CreatedAt
- UpdatedAt

### ClassDocuments

- Id
- ClassSessionId
- UploadedByUserId
- Title
- Description
- FileName
- FilePath
- FileType
- FileSize
- VisibilityType
- UploadedAt
- UpdatedAt
- IsActive

### Attendance

- Id
- ClassSessionId
- StudentId
- Status
- MarkedByUserId
- MarkedAt
- Notes

### Payments

- Id
- StudentId
- CourseId
- Amount
- PaymentMonth
- PaymentDate
- PaymentMethod
- Status
- Notes
- CreatedByUserId
- CreatedAt

### Announcements

- Id
- Title
- Message
- CourseId
- CreatedByUserId
- CreatedAt
- ExpiryDate
- IsActive

## 38.2 Phase 2 Tables

### ParentStudents

- Id
- ParentUserId
- StudentId
- Relationship
- CreatedAt

### MeetingIntegrations

- Id
- TeacherId
- Provider
- ExternalAccountId
- AccessTokenEncrypted
- RefreshTokenEncrypted
- TokenExpiry
- CreatedAt
- UpdatedAt

### OnlinePayments

- Id
- StudentId
- CourseId
- PaymentId
- Gateway
- GatewayReference
- Amount
- Status
- RequestPayload
- ResponsePayload
- CreatedAt
- UpdatedAt

### NotificationLogs

- Id
- UserId
- Channel
- Type
- Message
- Status
- SentAt

### Assignments

- Id
- CourseId
- ClassSessionId
- Title
- Description
- Deadline
- CreatedByUserId
- CreatedAt

### AssignmentSubmissions

- Id
- AssignmentId
- StudentId
- FilePath
- Comment
- Marks
- Feedback
- SubmittedAt
- ReviewedAt

### Quizzes

- Id
- CourseId
- Title
- Description
- StartTime
- EndTime
- CreatedByUserId
- CreatedAt

### QuizQuestions

- Id
- QuizId
- QuestionText
- QuestionType
- Marks

### QuizAnswers

- Id
- QuizQuestionId
- AnswerText
- IsCorrect

### StudentQuizAttempts

- Id
- QuizId
- StudentId
- Score
- StartedAt
- SubmittedAt

### ClassRecordings

- Id
- ClassSessionId
- RecordingUrl
- Title
- Description
- VisibilityType
- CreatedAt

### TeacherSalaries

- Id
- TeacherId
- SalaryMonth
- Amount
- Status
- PaidAt
- Notes

### Branches

- Id
- Name
- Address
- PhoneNumber
- Status

### AuditLogs

- Id
- UserId
- Action
- EntityName
- EntityId
- OldValue
- NewValue
- CreatedAt

## 39. Suggested API Endpoints

## 39.1 Phase 1 API Endpoints

### Authentication

```text
POST /api/auth/login
POST /api/auth/register
POST /api/auth/refresh-token
GET  /api/auth/me
```

### Students

```text
GET    /api/students
GET    /api/students/{id}
POST   /api/students
PUT    /api/students/{id}
DELETE /api/students/{id}
```

### Teachers

```text
GET    /api/teachers
GET    /api/teachers/{id}
POST   /api/teachers
PUT    /api/teachers/{id}
DELETE /api/teachers/{id}
```

### Courses

```text
GET    /api/courses
GET    /api/courses/{id}
POST   /api/courses
PUT    /api/courses/{id}
DELETE /api/courses/{id}
POST   /api/courses/{courseId}/students/{studentId}
DELETE /api/courses/{courseId}/students/{studentId}
```

### Class Sessions

```text
GET    /api/class-sessions
GET    /api/class-sessions/{id}
POST   /api/class-sessions
PUT    /api/class-sessions/{id}
DELETE /api/class-sessions/{id}
POST   /api/class-sessions/{id}/mark-completed
```

### Class Documents - Admin / Teacher

```text
POST   /api/class-sessions/{sessionId}/documents
GET    /api/class-sessions/{sessionId}/documents/admin
PUT    /api/class-documents/{documentId}
DELETE /api/class-documents/{documentId}
```

### Class Documents - Student

```text
GET /api/student/courses/{courseId}/documents
GET /api/student/class-sessions/{sessionId}/documents
GET /api/student/class-documents/{documentId}/download
```

### Attendance

```text
GET  /api/class-sessions/{sessionId}/attendance
POST /api/class-sessions/{sessionId}/attendance
PUT  /api/attendance/{attendanceId}
GET  /api/students/{studentId}/attendance
```

### Payments

```text
GET  /api/payments
GET  /api/students/{studentId}/payments
POST /api/payments
PUT  /api/payments/{paymentId}
GET  /api/payments/reports/monthly
```

### Announcements

```text
GET    /api/announcements
POST   /api/announcements
PUT    /api/announcements/{id}
DELETE /api/announcements/{id}
GET    /api/student/announcements
```

## 39.2 Phase 2 API Endpoints

### Meeting Integrations

```text
POST /api/integrations/google/connect
POST /api/integrations/zoom/connect
POST /api/class-sessions/{id}/generate-google-meet
POST /api/class-sessions/{id}/generate-zoom-meeting
```

### Online Payments

```text
POST /api/payments/online/create
POST /api/payments/webhooks/payhere
POST /api/payments/webhooks/stripe
GET  /api/payments/online/logs
```

### Parent Portal

```text
GET /api/parent/students
GET /api/parent/students/{studentId}/attendance
GET /api/parent/students/{studentId}/payments
GET /api/parent/students/{studentId}/schedule
```

### Notifications

```text
POST /api/notifications/send
GET  /api/notifications/logs
POST /api/notifications/payment-reminders
POST /api/notifications/class-reminders
```

### Assignments

```text
GET    /api/assignments
POST   /api/assignments
PUT    /api/assignments/{id}
DELETE /api/assignments/{id}
POST   /api/assignments/{id}/submit
PUT    /api/assignment-submissions/{id}/review
```

### Quizzes

```text
GET    /api/quizzes
POST   /api/quizzes
PUT    /api/quizzes/{id}
DELETE /api/quizzes/{id}
POST   /api/quizzes/{id}/attempt
POST   /api/quizzes/{id}/submit
```

### Reports

```text
GET /api/reports/income/pdf
GET /api/reports/income/excel
GET /api/reports/attendance/pdf
GET /api/reports/attendance/excel
GET /api/reports/course-performance
```

## 40. Business Rules

## 40.1 Student Access Rules

- Students can only view courses they are enrolled in.
- Students can only view class sessions from enrolled courses.
- Students can only join online classes from enrolled courses.
- Students can only download documents if the visibility rule allows access.

## 40.2 Document Access Rules

- A document must belong to a class session.
- A document must be active to be visible.
- Direct file URLs should not be publicly accessible.
- Backend must validate access before serving files.
- Teachers can manage documents only for their assigned courses unless they are admins.

## 40.3 Class Completion Rules

- Only admin or assigned teacher can mark class as completed.
- Documents with After Class visibility should only become available after the class is completed.

## 40.4 Payment Rules

- Payment can be recorded manually by admin in Phase 1.
- Payment can be processed online in Phase 2.
- Payment should be linked to student and course.
- Payment status should be tracked monthly.
- Overdue payments should be shown in admin dashboard.

## 40.5 Integration Rules

- Third-party access tokens should never be exposed to the frontend.
- Meeting host URLs should not be shown to students.
- Payment webhooks should be validated before updating payment status.
- Notification failures should be logged.

## 41. Suggested Project Name

Possible names:

- ClassFlow
- EduFlow
- ClassBridge
- TutorDesk
- LessonLink
- StudyHub
- TeachPanel

Recommended name:

```text
ClassFlow
```

## 42. Project Summary

ClassFlow is an online class management system for teachers and institutes to manage students, teachers, courses, online class sessions, attendance, payments, announcements, and class documents.

Phase 1 focuses on the core MVP: admin panel, student management, teacher management, course scheduling, manual online meeting links, attendance, payments, document upload, and visibility control.

Phase 2 adds advanced features such as Google Meet integration, Zoom integration, online payments, parent portal, notifications, assignments, quizzes, cloud storage, advanced reports, and mobile app support.
