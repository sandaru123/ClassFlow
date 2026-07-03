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
import { StudentDashboardPage } from '../pages/StudentDashboardPage'
import { StudentsPage } from '../pages/StudentsPage'
import { TeacherDashboardPage } from '../pages/TeacherDashboardPage'
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

const studentNavigation = [{ label: 'Dashboard', to: '/student/dashboard' }]

const teacherNavigation = [{ label: 'Dashboard', to: '/teacher/dashboard' }]

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
    children: [{ path: 'dashboard', element: <StudentDashboardPage /> }],
  },
  {
    path: '/teacher',
    element: (
      <ProtectedRoute allowedRoles={['Teacher']}>
        <AppLayout navigation={teacherNavigation} portalLabel="Teacher Portal" />
      </ProtectedRoute>
    ),
    children: [{ path: 'dashboard', element: <TeacherDashboardPage /> }],
  },
  {
    path: '*',
    element: <AuthLandingRedirect />,
  },
])
