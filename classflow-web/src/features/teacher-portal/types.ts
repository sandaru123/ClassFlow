export type ClassMode = 0 | 1 | 2
export type ClassSessionStatus = 0 | 1 | 2 | 3
export type AttendanceStatus = 0 | 1 | 2 | 3
export type DocumentVisibilityType = 0 | 1 | 2 | 3 | 4

export type TeacherCourseResponse = {
  courseId: number
  teacherId: number
  teacherName: string
  courseName: string
  description: string | null
  monthlyFee: number
  isActive: boolean
  createdAt: string
}

export type TeacherClassSessionResponse = {
  classSessionId: number
  courseId: number
  courseName: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  classMode: ClassMode
  meetingProvider: string | null
  meetingUrl: string | null
  meetingPassword: string | null
  status: ClassSessionStatus
}

export type TeacherStudentResponse = {
  studentId: number
  firstName: string
  lastName: string
  email: string | null
  phoneNumber: string | null
  courseId: number
  courseName: string
  enrolledAt: string
}

export type TeacherAttendanceResponse = {
  attendanceId: number
  studentId: number
  studentName: string
  classSessionId: number
  classSessionTitle: string
  courseId: number
  courseName: string
  status: AttendanceStatus
  notes: string | null
  markedAt: string
}

export type TeacherDocumentResponse = {
  documentId: number
  classSessionId: number
  classSessionTitle: string
  courseId: number
  courseName: string
  title: string
  description: string | null
  originalFileName: string
  fileType: string | null
  fileSizeInBytes: number
  visibilityType: DocumentVisibilityType
  isActive: boolean
  uploadedAt: string
}
