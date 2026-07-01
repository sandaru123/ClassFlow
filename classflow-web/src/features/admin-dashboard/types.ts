export type RecentPayment = {
  id: string
  studentName: string
  courseName: string
  amount: number
  paymentDate: string
  paymentMethod: string
  status: string
}

export type UpcomingClass = {
  id: string
  title: string
  courseName: string
  teacherName: string
  startTime: string
  endTime: string
  classMode: string
  status: string
}

export type AdminDashboardResponse = {
  totalStudents: number
  totalTeachers: number
  totalCourses: number
  activeEnrollments: number
  todayClasses: number
  upcomingClassesCount: number
  pendingPayments: number
  totalPendingAmount: number
  totalPaidAmountThisMonth: number
  recentPayments: RecentPayment[]
  upcomingClasses: UpcomingClass[]
}
