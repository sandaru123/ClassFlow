export type EnrollmentStatus = 0 | 1 | 2 | 3

export type EnrollmentResponse = {
  id: number
  studentId: number
  studentName: string
  courseId: number
  courseName: string
  enrolledAt: string
  status: EnrollmentStatus
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export type CreateEnrollmentRequest = {
  studentId: number
  courseId: number
  enrolledAt: string | null
  status: EnrollmentStatus
}

export type UpdateEnrollmentRequest = {
  studentId: number
  courseId: number
  enrolledAt: string
  status: EnrollmentStatus
  isActive: boolean
}
