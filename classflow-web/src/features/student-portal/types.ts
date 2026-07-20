export type ClassMode = 0 | 1 | 2
export type ClassSessionStatus = 0 | 1 | 2 | 3
export type EnrollmentStatus = 0 | 1 | 2 | 3
export type PaymentStatus = 0 | 1 | 2 | 3 | 4
export type PaymentMethod = 0 | 1 | 2 | 3 | 4
export type AttendanceStatus = 0 | 1 | 2 | 3
export type DocumentVisibilityType = 0 | 1 | 2 | 3 | 4

export type MyCourseResponse = {
  courseId: number
  courseName: string
  description: string | null
  monthlyFee: number
  teacherId: number
  teacherName: string
  enrolledAt: string
}

export type MyClassSessionResponse = {
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

export type MyPaymentResponse = {
  paymentId: number
  courseId: number
  courseName: string
  amount: number
  paidAmount: number
  balanceAmount: number
  paymentMonth: number
  paymentYear: number
  paymentMethod: PaymentMethod | null
  paymentStatus: PaymentStatus
  paymentDate: string | null
  notes: string | null
}

export type MyAttendanceResponse = {
  attendanceId: number
  classSessionId: number
  classSessionTitle: string
  courseId: number
  courseName: string
  status: AttendanceStatus
  notes: string | null
  markedAt: string
}

export type MyDocumentResponse = {
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
  uploadedAt: string
}

export type MyCourseSessionDocumentResponse = {
  documentId: number
  title: string
  description: string | null
  originalFileName: string
  fileType: string | null
  fileSizeInBytes: number
  visibilityType: DocumentVisibilityType
  uploadedAt: string
  isAvailable: boolean
  availabilityMessage: string
}

export type MyCourseSessionDetailsResponse = {
  classSessionId: number
  title: string
  description: string | null
  startTime: string
  endTime: string
  classMode: ClassMode
  status: ClassSessionStatus
  meetingProvider: string | null
  meetingUrl: string | null
  documents: MyCourseSessionDocumentResponse[]
}

export type MyCourseDetailsResponse = {
  courseId: number
  courseName: string
  description: string | null
  monthlyFee: number
  teacherId: number
  teacherName: string
  teacherEmail: string | null
  teacherPhoneNumber: string | null
  enrolledAt: string
  enrollmentStatus: EnrollmentStatus
  sessions: MyCourseSessionDetailsResponse[]
}
