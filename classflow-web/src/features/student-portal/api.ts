import { apiClient } from '../../api/client'
import type {
  MyAttendanceResponse,
  MyClassSessionResponse,
  MyCourseResponse,
  MyDocumentResponse,
  MyPaymentResponse,
} from './types'

export async function getMyCourses(): Promise<MyCourseResponse[]> {
  const response = await apiClient.get<MyCourseResponse[]>('/student-portal/my-courses')
  return response.data
}

export async function getMyUpcomingClasses(): Promise<MyClassSessionResponse[]> {
  const response = await apiClient.get<MyClassSessionResponse[]>(
    '/student-portal/my-upcoming-classes',
  )
  return response.data
}

export async function getMyClassSessions(): Promise<MyClassSessionResponse[]> {
  const response = await apiClient.get<MyClassSessionResponse[]>(
    '/student-portal/my-class-sessions',
  )
  return response.data
}

export async function getMyPayments(): Promise<MyPaymentResponse[]> {
  const response = await apiClient.get<MyPaymentResponse[]>('/student-portal/my-payments')
  return response.data
}

export async function getMyAttendance(): Promise<MyAttendanceResponse[]> {
  const response = await apiClient.get<MyAttendanceResponse[]>(
    '/student-portal/my-attendance',
  )
  return response.data
}

export async function getMyDocuments(): Promise<MyDocumentResponse[]> {
  const response = await apiClient.get<MyDocumentResponse[]>('/student-portal/my-documents')
  return response.data
}

export async function downloadStudentDocument(documentId: number): Promise<Blob> {
  const response = await apiClient.get(`/student/class-documents/${documentId}/download`, {
    responseType: 'blob',
  })
  return response.data as Blob
}
