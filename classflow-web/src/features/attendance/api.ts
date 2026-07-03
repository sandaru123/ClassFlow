import { apiClient } from '../../api/client'
import type {
  AttendanceResponse,
  BulkMarkAttendanceRequest,
  MarkAttendanceRequest,
  UpdateAttendanceRequest,
} from './types'

export async function getAttendance(): Promise<AttendanceResponse[]> {
  const response = await apiClient.get<AttendanceResponse[]>('/attendance')
  return response.data
}

export async function getAttendanceById(id: number): Promise<AttendanceResponse> {
  const response = await apiClient.get<AttendanceResponse>(`/attendance/${id}`)
  return response.data
}

export async function getAttendanceBySessionId(
  classSessionId: number,
): Promise<AttendanceResponse[]> {
  const response = await apiClient.get<AttendanceResponse[]>(
    `/attendance/session/${classSessionId}`,
  )
  return response.data
}

export async function getAttendanceByStudentId(
  studentId: number,
): Promise<AttendanceResponse[]> {
  const response = await apiClient.get<AttendanceResponse[]>(
    `/attendance/student/${studentId}`,
  )
  return response.data
}

export async function markAttendance(
  payload: MarkAttendanceRequest,
): Promise<AttendanceResponse> {
  const response = await apiClient.post<AttendanceResponse>('/attendance', payload)
  return response.data
}

export async function bulkMarkAttendance(
  payload: BulkMarkAttendanceRequest,
): Promise<AttendanceResponse[]> {
  const response = await apiClient.post<AttendanceResponse[]>(
    '/attendance/bulk',
    payload,
  )
  return response.data
}

export async function updateAttendance(
  id: number,
  payload: UpdateAttendanceRequest,
): Promise<AttendanceResponse> {
  const response = await apiClient.put<AttendanceResponse>(
    `/attendance/${id}`,
    payload,
  )
  return response.data
}

export async function deleteAttendance(id: number): Promise<void> {
  await apiClient.delete(`/attendance/${id}`)
}
