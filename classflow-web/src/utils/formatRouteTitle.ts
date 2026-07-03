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
  '/student/attendance': 'My Attendance',
  '/student/courses': 'My Courses',
  '/student/dashboard': 'Student Dashboard',
  '/student/documents': 'My Documents',
  '/student/payments': 'My Payments',
  '/student/schedule': 'My Schedule',
  '/teacher/attendance': 'My Attendance',
  '/teacher/class-sessions': 'My Class Sessions',
  '/teacher/courses': 'My Courses',
  '/teacher/dashboard': 'Teacher Dashboard',
  '/teacher/documents': 'My Documents',
  '/teacher/students': 'My Students',
}

export function formatRouteTitle(pathname: string) {
  if (pathname.startsWith('/admin/courses/') && pathname.includes('/sessions/')) {
    return 'Session Workspace'
  }

  if (pathname.startsWith('/teacher/courses/') && pathname.includes('/sessions/')) {
    return 'Session Workspace'
  }

  if (pathname.startsWith('/admin/courses/')) {
    return 'Course Workspace'
  }

  if (pathname.startsWith('/teacher/courses/')) {
    return 'Course Workspace'
  }

  return routeTitles[pathname] ?? 'ClassFlow'
}
