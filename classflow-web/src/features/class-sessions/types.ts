export type ClassSessionStatus = 0 | 1 | 2 | 3
export type ClassMode = 0 | 1 | 2

export type ClassSessionResponse = {
  id: number
  courseId: number
  courseName: string
  teacherId: number
  teacherName: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  classMode: ClassMode
  meetingProvider: string | null
  meetingUrl: string | null
  meetingPassword: string | null
  status: ClassSessionStatus
  createdAt: string
  updatedAt: string | null
}

export type CreateClassSessionRequest = {
  courseId: number
  teacherId: number
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

export type UpdateClassSessionRequest = CreateClassSessionRequest
