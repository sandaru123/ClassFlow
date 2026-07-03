import { apiClient } from '../../api/client'
import type {
  CreateStudentRequest,
  StudentResponse,
  UpdateStudentRequest,
} from './types'

export async function getStudents(): Promise<StudentResponse[]> {
  const response = await apiClient.get<StudentResponse[]>('/students')
  return response.data
}

export async function getStudentById(id: number): Promise<StudentResponse> {
  const response = await apiClient.get<StudentResponse>(`/students/${id}`)
  return response.data
}

export async function createStudent(
  payload: CreateStudentRequest,
): Promise<StudentResponse> {
  const response = await apiClient.post<StudentResponse>('/students', payload)
  return response.data
}

export async function updateStudent(
  id: number,
  payload: UpdateStudentRequest,
): Promise<StudentResponse> {
  const response = await apiClient.put<StudentResponse>(`/students/${id}`, payload)
  return response.data
}

export async function deactivateStudent(id: number): Promise<void> {
  await apiClient.patch(`/students/${id}/deactivate`)
}

export async function reactivateStudent(id: number): Promise<void> {
  await apiClient.patch(`/students/${id}/reactivate`)
}

export async function deleteStudentForever(id: number): Promise<void> {
  await apiClient.delete(`/students/${id}/delete-forever`)
}
