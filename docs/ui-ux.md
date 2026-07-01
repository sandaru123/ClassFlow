# Online Class Management System - UI/UX Design Document

## 1. UI/UX Goal

The Online Class Management System should feel like a clean SaaS-style dashboard for teachers, institutes, and students.

The main UX goal is:

> Students should always know what their next class is, how to join it, what documents are available, and whether their payment is pending.

The admin and teacher experience should make it easy to manage students, courses, schedules, attendance, payments, and documents from one place.

---

## 2. Main UI Concept

The application should use a dashboard-style layout.

```text
Left Sidebar + Top Header + Main Content Area
```

Example layout:

```text
-------------------------------------------------
| Sidebar       | Top Bar: Search / Profile      |
|---------------|---------------------------------|
| Dashboard     | Main page content               |
| Students      | Cards, tables, forms, calendar  |
| Courses       |                                 |
| Sessions      |                                 |
| Attendance    |                                 |
| Payments      |                                 |
| Documents     |                                 |
| Reports       |                                 |
-------------------------------------------------
```

---

## 3. Design Style

The UI should be:

- Clean
- Minimal
- Modern
- Easy to scan
- Mobile-friendly for students
- Desktop-friendly for admins and teachers

Recommended visual style:

- Rounded cards
- Soft shadows
- Clear tables
- Status badges
- Simple forms
- Clear action buttons
- Good spacing between sections

---

## 4. Recommended Frontend UI Stack

```text
React + TypeScript
Tailwind CSS
shadcn/ui
Lucide React Icons
FullCalendar
React Hook Form
Zod
```

### Suggested usage

| Tool | Usage |
|---|---|
| React | Main frontend framework |
| TypeScript | Type safety |
| Tailwind CSS | Styling |
| shadcn/ui | Reusable UI components |
| Lucide React | Icons |
| FullCalendar | Class schedule calendar |
| React Hook Form | Form handling |
| Zod | Form validation |

---

## 5. Color System

Use a calm education/business color theme.

### Suggested colors

| Purpose | Color |
|---|---|
| Primary | Blue or Indigo |
| Secondary | Slate / Gray |
| Success | Green |
| Warning | Yellow / Orange |
| Danger | Red |
| Background | Light Gray |
| Cards | White |

### Status colors

| Status | Suggested Color |
|---|---|
| Scheduled | Blue |
| Ongoing | Green |
| Completed | Gray |
| Cancelled | Red |
| Payment Paid | Green |
| Payment Pending | Orange |
| Payment Overdue | Red |
| Document Available | Green |
| Document Locked | Gray / Orange |

---

## 6. User Portals

The system should support different user experiences based on role.

### Phase 1 portals

- Admin Portal
- Teacher Portal
- Student Portal

### Phase 2 portals

- Parent Portal
- Advanced Teacher Portal
- Mobile/PWA student experience

---

# 7. Admin / Teacher UI

## 7.1 Admin Dashboard

The admin dashboard should be the first screen after login.

### Dashboard summary cards

- Total Students
- Active Courses
- Today’s Classes
- Pending Payments
- Monthly Income
- Uploaded Documents
- Attendance Percentage

Example:

```text
-------------------------------------------------
| Total Students | Active Courses | Today Classes |
| Pending Fees   | Monthly Income | Attendance %  |
-------------------------------------------------
```

### Dashboard sections

- Today’s class schedule
- Recent payments
- Pending attendance
- Recent document uploads
- Announcements

Example table:

```text
Today's Classes
-------------------------------------------------
| Time     | Course              | Mode   | Action |
| 6:00 PM  | Grade 10 Music      | Online | View   |
| 7:30 PM  | Beginner Guitar     | Online | View   |
-------------------------------------------------
```

---

## 7.2 Student Management UI

The student management page should use a searchable table.

### Main actions

- Add Student
- Edit Student
- View Profile
- Assign Course
- Deactivate Student

### Table columns

- Student Name
- Email / Phone
- Assigned Courses
- Payment Status
- Account Status
- Actions

### Student profile tabs

- Overview
- Courses
- Attendance
- Payments
- Documents
- Notes

---

## 7.3 Course Management UI

The course management page should show all active and inactive courses.

### Course table columns

- Course Name
- Teacher
- Monthly Fee
- Student Count
- Status
- Actions

### Course detail page tabs

- Overview
- Students
- Class Sessions
- Documents
- Payments
- Reports

---

## 7.4 Class Session UI

Class sessions are one of the most important parts of the system.

### Admin/teacher should be able to:

- Create class session
- Set date and time
- Choose class mode: Physical, Online, or Hybrid
- Add Zoom / Google Meet manual link
- Upload documents
- Mark attendance
- Mark class as completed
- Cancel class

### Class session filters

- Today
- This Week
- Upcoming
- Completed
- Cancelled

Example class session card:

```text
Beginner Guitar - Lesson 05
Date: 2026-07-10
Time: 7:00 PM - 8:00 PM
Mode: Online
Status: Scheduled

[Edit] [Upload Documents] [Mark Attendance] [Complete Class]
```

---

## 7.5 Calendar View

A calendar view should be included for class scheduling.

### Calendar views

- Monthly view
- Weekly view
- Daily view

### Calendar color coding

| Class Status | Color |
|---|---|
| Scheduled | Blue |
| Ongoing | Green |
| Completed | Gray |
| Cancelled | Red |

This gives the system a professional scheduling experience.

---

## 7.6 Attendance UI

The attendance screen should be fast and simple.

Example:

```text
Grade 10 Music - Lesson 05
Date: 2026-07-10

[Mark All Present]

-------------------------------------------------
| Student Name | Present | Absent | Late | Excused |
-------------------------------------------------
| Nimal        |   ○     |   ○    |  ○   |   ○     |
| Kamal        |   ○     |   ○    |  ○   |   ○     |
-------------------------------------------------

[Save Attendance]
```

### Attendance UX features

- Mark all present
- Search student
- Show absent count
- Save attendance
- Allow teacher/admin to edit attendance later

---

## 7.7 Payment UI

The payment page should clearly show who has paid and who has pending fees.

### Payment filters

- Paid
- Pending
- Partially Paid
- Overdue
- This Month
- Course

### Payment table columns

- Student
- Course
- Month
- Amount
- Paid Amount
- Status
- Payment Date
- Actions

### Payment actions

- Record Payment
- View Receipt
- Download Receipt
- Send Reminder - Phase 2

---

## 7.8 Document Upload UI

The document upload feature is a special feature of this system, so it should be designed clearly.

### Upload form fields

- Document Title
- Description
- Class Session
- File Upload
- Display Timing

### Display timing options

- Available Immediately
- Available Before Class
- Available During Class
- Available After Class
- Available After Teacher Marks Completed

Example form:

```text
Upload Class Document

Document Title
Description
Class Session
File Upload
Display Timing
    ○ Available Immediately
    ○ Available Before Class
    ○ Available During Class
    ○ Available After Class
    ○ Available After Teacher Marks Completed

[Upload]
```

### Document table columns

- Title
- Class Session
- File Type
- Visibility
- Uploaded Date
- Status
- Actions

Example:

```text
-------------------------------------------------------------
| Title             | Visibility        | Status     | Action |
-------------------------------------------------------------
| Chord Sheet.pdf   | Before Class      | Available  | Edit   |
| Lesson Notes.pdf  | After Class       | Locked     | Edit   |
| Audio Track.mp3   | During Class      | Locked     | Edit   |
-------------------------------------------------------------
```

### Document UX features

- File type icon
- PDF icon
- Image thumbnail
- Audio icon
- File size
- Upload progress bar
- Locked/Available badge

---

# 8. Student UI

The student portal should be simpler than the admin panel.

The student should not see too many management features. They should mainly see classes, documents, payments, and announcements.

---

## 8.1 Student Dashboard

The student dashboard should show the most important information first.

### Dashboard sections

- Next Class
- Today’s Classes
- Pending Payments
- Recent Documents
- Announcements
- Attendance Summary

Example:

```text
Next Class
Beginner Guitar - Lesson 05
Today at 7:00 PM
[Join Class]
```

---

## 8.2 My Courses

Students should see the courses they are enrolled in.

Example course card:

```text
Beginner Guitar
Teacher: Sandaru
Next Class: Friday 7:00 PM
Attendance: 85%
Payment: Paid

[View Course]
```

---

## 8.3 Class Session View

Each class session page should show:

- Class title
- Date and time
- Teacher
- Meeting link
- Documents
- Attendance status

### Before class

- Join button can be disabled until a defined time before class.
- Before-class documents are visible.

Example:

```text
Join button available 10 minutes before class starts.
```

### During class

- Join Class button is active.
- During-class documents are visible.

### After class

- After-class documents become available.
- Attendance result is shown.

---

## 8.4 Student Documents UI

Documents should be separated into available and locked sections.

Example:

```text
Available Documents
-------------------------------------------------
Chord Sheet.pdf                  [Download]
Practice Audio.mp3               [Download]

Locked Documents
-------------------------------------------------
Lesson Summary.pdf               Available after class is completed
Exam Tips.pdf                    Available during class
```

This is good UX because students understand why they cannot access a file.

---

## 8.5 Student Payments UI

Students should be able to see:

- Current month payment status
- Payment history
- Pending amount
- Receipts

Example:

```text
July 2026 Fee
Status: Pending
Amount: Rs. 3,000

[View Payment History]
```

For Phase 1, payment can be manual. Online payments can be added in Phase 2.

---

# 9. Navigation Structure

## 9.1 Admin / Teacher Sidebar

```text
Dashboard
Students
Courses
Class Sessions
Attendance
Payments
Documents
Announcements
Reports
Settings
```

## 9.2 Student Sidebar

```text
Dashboard
My Courses
Schedule
Documents
Payments
Announcements
Profile
```

---

# 10. Important UX Rules

## 10.1 Keep the interface simple

Do not show too many options at once. Keep each page focused on one main task.

---

## 10.2 Use clear action buttons

Good button labels:

- Create Class
- Upload Document
- Record Payment
- Mark Attendance
- Join Class
- Download

Avoid vague labels like:

- Submit
- Process
- Manage
- Proceed

---

## 10.3 Use status badges everywhere

Badges help users scan the system quickly.

Examples:

- Paid
- Pending
- Overdue
- Scheduled
- Ongoing
- Completed
- Locked
- Available

---

## 10.4 Show empty states

Do not show blank tables.

Admin example:

```text
No class documents uploaded yet.
Upload your first document for this class.
```

Student example:

```text
No documents are available yet.
Your teacher may upload materials before or after the class.
```

---

## 10.5 Confirm dangerous actions

Use confirmation modals for:

- Delete student
- Delete document
- Cancel class
- Remove payment record
- Deactivate user

---

## 10.6 Keep forms organized

Use form sections instead of one long form.

Example student form sections:

- Basic Details
- Contact Details
- Parent Details
- Course Assignment

---

## 10.7 Make student screens mobile-friendly

Students may use phones, so the student portal must work well on mobile.

Priority mobile screens:

- Student dashboard
- Join class
- View documents
- View payment status
- Announcements

Admin screens can be desktop-first but should still be responsive.

---

# 11. Recommended Page List

## 11.1 Admin / Teacher Pages

```text
/auth/login
/admin/dashboard
/admin/students
/admin/students/create
/admin/students/:id
/admin/courses
/admin/courses/create
/admin/courses/:id
/admin/class-sessions
/admin/class-sessions/create
/admin/class-sessions/:id
/admin/attendance
/admin/payments
/admin/documents
/admin/announcements
/admin/reports
/admin/settings
```

## 11.2 Student Pages

```text
/student/dashboard
/student/courses
/student/courses/:id
/student/schedule
/student/documents
/student/payments
/student/announcements
/student/profile
```

---

# 12. Phase 1 UI/UX Scope

Phase 1 should focus on the core screens required for the MVP.

## Phase 1 screens

- Login
- Admin dashboard
- Student management
- Course management
- Class session management
- Attendance marking
- Payment tracking
- Document upload and visibility control
- Student dashboard
- Student course view
- Student documents view
- Student payment view

---

# 13. Phase 2 UI/UX Scope

Phase 2 should include advanced screens and improved user experience.

## Phase 2 screens and features

- Parent portal
- Online payment screen
- Zoom/Google Meet integration setup
- Reports dashboard
- Email/SMS notification settings
- Advanced calendar scheduling
- Teacher availability
- Assignment submission
- Document preview
- Analytics dashboard
- Mobile app-style PWA

---

# 14. Final UI Direction

The system should be designed as:

> A clean SaaS-style admin dashboard for teachers and institutes, with a simple mobile-friendly student portal.

Possible project name:

```text
ClassFlow
```

Product description:

> ClassFlow helps teachers manage online classes, students, schedules, payments, attendance, and class documents from one clean dashboard.
