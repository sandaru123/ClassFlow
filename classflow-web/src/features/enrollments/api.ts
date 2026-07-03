import { apiClient } from '../../api/client'
import type {
  CreateEnrollmentRequest,
  EnrollmentResponse,
  UpdateEnrollmentRequest,
} from './types'

export async function getEnrollments(): Promise<EnrollmentResponse[]> {
  const response = await apiClient.get<EnrollmentResponse[]>('/enrollments')
  return response.data
}

export async function getEnrollmentById(id: number): Promise<EnrollmentResponse> {
  const response = await apiClient.get<EnrollmentResponse>(`/enrollments/${id}`)
  return response.data
}

export async function getEnrollmentsByStudentId(
  studentId: number,
): Promise<EnrollmentResponse[]> {
  const response = await apiClient.get<EnrollmentResponse[]>(
    `/enrollments/student/${studentId}`,
  )
  return response.data
}

export async function getEnrollmentsByCourseId(
  courseId: number,
): Promise<EnrollmentResponse[]> {
  const response = await apiClient.get<EnrollmentResponse[]>(
    `/enrollments/course/${courseId}`,
  )
  return response.data
}

export async function createEnrollment(
  payload: CreateEnrollmentRequest,
): Promise<EnrollmentResponse> {
  const response = await apiClient.post<EnrollmentResponse>('/enrollments', payload)
  return response.data
}

export async function updateEnrollment(
  id: number,
  payload: UpdateEnrollmentRequest,
): Promise<EnrollmentResponse> {
  const response = await apiClient.put<EnrollmentResponse>(
    `/enrollments/${id}`,
    payload,
  )
  return response.data
}

export async function deactivateEnrollment(id: number): Promise<void> {
  await apiClient.patch(`/enrollments/${id}/deactivate`)
}

export async function reactivateEnrollment(id: number): Promise<void> {
  await apiClient.patch(`/enrollments/${id}/reactivate`)
}

export async function deleteEnrollmentForever(id: number): Promise<void> {
  await apiClient.delete(`/enrollments/${id}/delete-forever`)
}
