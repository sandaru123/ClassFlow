export type AttendanceStatus = 0 | 1 | 2 | 3

export type AttendanceResponse = {
  id: number
  studentId: number
  studentName: string
  classSessionId: number
  classSessionTitle: string
  status: AttendanceStatus
  notes: string | null
  markedAt: string
  createdAt: string
  updatedAt: string | null
}

export type MarkAttendanceRequest = {
  studentId: number
  classSessionId: number
  status: AttendanceStatus
  notes: string | null
}

export type UpdateAttendanceRequest = {
  status: AttendanceStatus
  notes: string | null
}

export type BulkAttendanceItemRequest = {
  studentId: number
  status: AttendanceStatus
  notes: string | null
}

export type BulkMarkAttendanceRequest = {
  classSessionId: number
  items: BulkAttendanceItemRequest[]
}
