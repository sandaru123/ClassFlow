const routeTitles: Record<string, string> = {
  '/admin/attendance': 'Attendance',
  '/admin/class-sessions': 'Class Sessions',
  '/admin/courses': 'Courses',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/documents': 'Documents',
  '/admin/enrollments': 'Enrollments',
  '/admin/payments': 'Payments',
  '/admin/students': 'Students',
  '/admin/teachers': 'Teachers',
  '/login': 'Login',
  '/student/dashboard': 'Student Dashboard',
  '/teacher/dashboard': 'Teacher Dashboard',
}

export function formatRouteTitle(pathname: string) {
  return routeTitles[pathname] ?? 'ClassFlow'
}
