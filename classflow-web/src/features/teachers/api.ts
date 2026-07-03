import { apiClient } from '../../api/client'
import type {
  CreateTeacherRequest,
  TeacherResponse,
  UpdateTeacherRequest,
} from './types'

export async function getTeachers(): Promise<TeacherResponse[]> {
  const response = await apiClient.get<TeacherResponse[]>('/teachers')
  return response.data
}

export async function getTeacherById(id: number): Promise<TeacherResponse> {
  const response = await apiClient.get<TeacherResponse>(`/teachers/${id}`)
  return response.data
}

export async function createTeacher(
  payload: CreateTeacherRequest,
): Promise<TeacherResponse> {
  const response = await apiClient.post<TeacherResponse>('/teachers', payload)
  return response.data
}

export async function updateTeacher(
  id: number,
  payload: UpdateTeacherRequest,
): Promise<TeacherResponse> {
  const response = await apiClient.put<TeacherResponse>(`/teachers/${id}`, payload)
  return response.data
}

export async function deactivateTeacher(id: number): Promise<void> {
  await apiClient.patch(`/teachers/${id}/deactivate`)
}

export async function reactivateTeacher(id: number): Promise<void> {
  await apiClient.patch(`/teachers/${id}/reactivate`)
}

export async function deleteTeacherForever(id: number): Promise<void> {
  await apiClient.delete(`/teachers/${id}/delete-forever`)
}
