import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '../components/layout/AppLayout'
import { AdminDashboardPage } from '../pages/AdminDashboardPage'
import { AttendancePage } from '../pages/AttendancePage'
import { ClassSessionsPage } from '../pages/ClassSessionsPage'
import { CoursesPage } from '../pages/CoursesPage'
import { DocumentsPage } from '../pages/DocumentsPage'
import { EnrollmentsPage } from '../pages/EnrollmentsPage'
import { LoginPage } from '../pages/LoginPage'
import { PaymentsPage } from '../pages/PaymentsPage'
import {
  AdminCourseDetailsPage,
  TeacherCourseDetailsPage,
} from '../pages/CourseDetailsPage'
import {
  AdminSessionDetailsPage,
  TeacherSessionDetailsPage,
} from '../pages/SessionDetailsPage'
import { StudentAttendancePage } from '../pages/StudentAttendancePage'
import { StudentCourseDetailsPage } from '../pages/StudentCourseDetailsPage'
import { StudentCoursesPage } from '../pages/StudentCoursesPage'
import { StudentDashboardPage } from '../pages/StudentDashboardPage'
import { StudentDocumentsPage } from '../pages/StudentDocumentsPage'
import { StudentPaymentsPage } from '../pages/StudentPaymentsPage'
import { StudentSchedulePage } from '../pages/StudentSchedulePage'
import { StudentsPage } from '../pages/StudentsPage'
import { TeacherAttendancePage } from '../pages/TeacherAttendancePage'
import { TeacherClassSessionsPage } from '../pages/TeacherClassSessionsPage'
import { TeacherCoursesPage } from '../pages/TeacherCoursesPage'
import { TeacherDashboardPage } from '../pages/TeacherDashboardPage'
import { TeacherDocumentsPage } from '../pages/TeacherDocumentsPage'
import { TeacherStudentsPage } from '../pages/TeacherStudentsPage'
import { TeachersPage } from '../pages/TeachersPage'
import { AuthLandingRedirect } from '../features/auth/AuthLandingRedirect'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { PublicRoute } from '../features/auth/PublicRoute'

const adminNavigation = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Students', to: '/admin/students' },
  { label: 'Teachers', to: '/admin/teachers' },
  { label: 'Courses', to: '/admin/courses' },
  { label: 'Enrollments', to: '/admin/enrollments' },
  { label: 'Class Sessions', to: '/admin/class-sessions' },
  { label: 'Attendance', to: '/admin/attendance' },
  { label: 'Payments', to: '/admin/payments' },
  { label: 'Documents', to: '/admin/documents' },
]

const studentNavigation = [
  { label: 'Dashboard', to: '/student/dashboard' },
  { label: 'Courses', to: '/student/courses' },
  { label: 'Schedule', to: '/student/schedule' },
  { label: 'Documents', to: '/student/documents' },
  { label: 'Payments', to: '/student/payments' },
  { label: 'Attendance', to: '/student/attendance' },
]

const teacherNavigation = [
  { label: 'Dashboard', to: '/teacher/dashboard' },
  { label: 'Courses', to: '/teacher/courses' },
  { label: 'Class Sessions', to: '/teacher/class-sessions' },
  { label: 'Students', to: '/teacher/students' },
  { label: 'Attendance', to: '/teacher/attendance' },
  { label: 'Documents', to: '/teacher/documents' },
]

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthLandingRedirect />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute allowedRoles={['SuperAdmin', 'Admin']}>
        <AppLayout navigation={adminNavigation} portalLabel="Admin Portal" />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'students', element: <StudentsPage /> },
      { path: 'teachers', element: <TeachersPage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'courses/:courseId', element: <AdminCourseDetailsPage /> },
      {
        path: 'courses/:courseId/sessions/:sessionId',
        element: <AdminSessionDetailsPage />,
      },
      { path: 'enrollments', element: <EnrollmentsPage /> },
      { path: 'class-sessions', element: <ClassSessionsPage /> },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'documents', element: <DocumentsPage /> },
    ],
  },
  {
    path: '/student',
    element: (
      <ProtectedRoute allowedRoles={['Student']}>
        <AppLayout navigation={studentNavigation} portalLabel="Student Portal" />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <StudentDashboardPage /> },
      { path: 'courses', element: <StudentCoursesPage /> },
      { path: 'courses/:courseId', element: <StudentCourseDetailsPage /> },
      { path: 'schedule', element: <StudentSchedulePage /> },
      { path: 'documents', element: <StudentDocumentsPage /> },
      { path: 'payments', element: <StudentPaymentsPage /> },
      { path: 'attendance', element: <StudentAttendancePage /> },
    ],
  },
  {
    path: '/teacher',
    element: (
      <ProtectedRoute allowedRoles={['Teacher']}>
        <AppLayout navigation={teacherNavigation} portalLabel="Teacher Portal" />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <TeacherDashboardPage /> },
      { path: 'courses', element: <TeacherCoursesPage /> },
      { path: 'courses/:courseId', element: <TeacherCourseDetailsPage /> },
      {
        path: 'courses/:courseId/sessions/:sessionId',
        element: <TeacherSessionDetailsPage />,
      },
      { path: 'class-sessions', element: <TeacherClassSessionsPage /> },
      { path: 'students', element: <TeacherStudentsPage /> },
      { path: 'attendance', element: <TeacherAttendancePage /> },
      { path: 'documents', element: <TeacherDocumentsPage /> },
    ],
  },
  {
    path: '*',
    element: <AuthLandingRedirect />,
  },
])
