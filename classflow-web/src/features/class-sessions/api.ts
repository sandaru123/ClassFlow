import { apiClient } from '../../api/client'
import type {
  ClassSessionResponse,
  CreateClassSessionRequest,
  UpdateClassSessionRequest,
} from './types'

export async function getClassSessions(): Promise<ClassSessionResponse[]> {
  const response = await apiClient.get<ClassSessionResponse[]>('/class-sessions')
  return response.data
}

export async function getClassSessionById(
  id: number,
): Promise<ClassSessionResponse> {
  const response = await apiClient.get<ClassSessionResponse>(`/class-sessions/${id}`)
  return response.data
}

export async function getClassSessionsByCourseId(
  courseId: number,
): Promise<ClassSessionResponse[]> {
  const response = await apiClient.get<ClassSessionResponse[]>(
    `/class-sessions/course/${courseId}`,
  )
  return response.data
}

export async function getUpcomingClassSessions(): Promise<ClassSessionResponse[]> {
  const response = await apiClient.get<ClassSessionResponse[]>(
    '/class-sessions/upcoming',
  )
  return response.data
}

export async function createClassSession(
  payload: CreateClassSessionRequest,
): Promise<ClassSessionResponse> {
  const response = await apiClient.post<ClassSessionResponse>(
    '/class-sessions',
    payload,
  )
  return response.data
}

export async function updateClassSession(
  id: number,
  payload: UpdateClassSessionRequest,
): Promise<ClassSessionResponse> {
  const response = await apiClient.put<ClassSessionResponse>(
    `/class-sessions/${id}`,
    payload,
  )
  return response.data
}

export async function cancelClassSession(
  id: number,
): Promise<ClassSessionResponse> {
  const response = await apiClient.patch<ClassSessionResponse>(
    `/class-sessions/${id}/cancel`,
  )
  return response.data
}

export async function completeClassSession(
  id: number,
): Promise<ClassSessionResponse> {
  const response = await apiClient.patch<ClassSessionResponse>(
    `/class-sessions/${id}/complete`,
  )
  return response.data
}
