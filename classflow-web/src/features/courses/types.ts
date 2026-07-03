export type CourseResponse = {
  id: number
  name: string
  description: string | null
  teacherId: number | null
  teacherName: string | null
  monthlyFee: number
  studentCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export type CreateCourseRequest = {
  name: string
  description: string | null
  teacherId: number | null
  monthlyFee: number
}

export type UpdateCourseRequest = {
  name: string
  description: string | null
  teacherId: number | null
  monthlyFee: number
  isActive: boolean
}
