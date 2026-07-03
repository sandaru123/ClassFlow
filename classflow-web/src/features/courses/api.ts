import axios from 'axios'
import { apiClient } from '../../api/client'
import type {
  CourseResponse,
  CreateCourseRequest,
  UpdateCourseRequest,
} from './types'

export async function getCourses(): Promise<CourseResponse[]> {
  const response = await apiClient.get<CourseResponse[]>('/courses')
  return response.data
}

export async function getCourseById(id: number): Promise<CourseResponse> {
  const response = await apiClient.get<CourseResponse>(`/courses/${id}`)
  return response.data
}

export async function createCourse(
  payload: CreateCourseRequest,
): Promise<CourseResponse> {
  const response = await apiClient.post<CourseResponse>('/courses', payload)
  return response.data
}

export async function updateCourse(
  id: number,
  payload: UpdateCourseRequest,
): Promise<CourseResponse> {
  const response = await apiClient.put<CourseResponse>(`/courses/${id}`, payload)
  return response.data
}

export async function deactivateCourse(id: number): Promise<void> {
  await apiClient.patch(`/courses/${id}/deactivate`)
}

export async function reactivateCourse(id: number): Promise<void> {
  await apiClient.patch(`/courses/${id}/reactivate`)
}

export async function deleteCourseForever(id: number): Promise<void> {
  try {
    await apiClient.delete(`/courses/${id}/delete-forever`)
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      (error.response?.status === 404 ||
        error.response?.status === 405 ||
        error.response?.status === 501)
    ) {
      await apiClient.delete(`/courses/${id}`)
      return
    }

    throw error
  }
}
