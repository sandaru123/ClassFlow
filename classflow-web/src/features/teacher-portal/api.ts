import { apiClient } from '../../api/client'
import type {
  TeacherAttendanceResponse,
  TeacherClassSessionResponse,
  TeacherCourseResponse,
  TeacherDocumentResponse,
  TeacherStudentResponse,
} from './types'

export async function getMyTeacherCourses(): Promise<TeacherCourseResponse[]> {
  const response = await apiClient.get<TeacherCourseResponse[]>(
    '/teacher-portal/my-courses',
  )
  return response.data
}

export async function getMyTeacherClassSessions(): Promise<
  TeacherClassSessionResponse[]
> {
  const response = await apiClient.get<TeacherClassSessionResponse[]>(
    '/teacher-portal/my-class-sessions',
  )
  return response.data
}

export async function getMyTeacherUpcomingClasses(): Promise<
  TeacherClassSessionResponse[]
> {
  const response = await apiClient.get<TeacherClassSessionResponse[]>(
    '/teacher-portal/my-upcoming-classes',
  )
  return response.data
}

export async function getMyTeacherStudents(): Promise<TeacherStudentResponse[]> {
  const response = await apiClient.get<TeacherStudentResponse[]>(
    '/teacher-portal/my-students',
  )
  return response.data
}

export async function getMyTeacherAttendance(): Promise<
  TeacherAttendanceResponse[]
> {
  const response = await apiClient.get<TeacherAttendanceResponse[]>(
    '/teacher-portal/my-attendance',
  )
  return response.data
}

export async function getMyTeacherDocuments(): Promise<TeacherDocumentResponse[]> {
  const response = await apiClient.get<TeacherDocumentResponse[]>(
    '/teacher-portal/my-documents',
  )
  return response.data
}
