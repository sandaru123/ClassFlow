import { apiClient } from '../../api/client'
import type {
  ClassDocumentResponse,
  UpdateClassDocumentRequest,
  UploadClassDocumentRequest,
} from './types'

export async function getClassDocuments(): Promise<ClassDocumentResponse[]> {
  const response = await apiClient.get<ClassDocumentResponse[]>('/class-documents')
  return response.data
}

export async function getClassDocumentById(
  id: number,
): Promise<ClassDocumentResponse> {
  const response = await apiClient.get<ClassDocumentResponse>(`/class-documents/${id}`)
  return response.data
}

export async function downloadClassDocument(id: number): Promise<Blob> {
  const response = await apiClient.get(`/class-documents/${id}/download`, {
    responseType: 'blob',
  })
  return response.data as Blob
}

export async function getClassDocumentsBySessionId(
  classSessionId: number,
): Promise<ClassDocumentResponse[]> {
  const response = await apiClient.get<ClassDocumentResponse[]>(
    `/class-documents/session/${classSessionId}`,
  )
  return response.data
}

export async function uploadClassDocument(
  payload: UploadClassDocumentRequest,
): Promise<ClassDocumentResponse> {
  const formData = new FormData()
  formData.append('classSessionId', String(payload.classSessionId))
  formData.append('title', payload.title)

  if (payload.description) {
    formData.append('description', payload.description)
  }

  formData.append('file', payload.file)
  formData.append('visibilityType', String(payload.visibilityType))

  const response = await apiClient.post<ClassDocumentResponse>(
    '/class-documents/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )
  return response.data
}

export async function updateClassDocument(
  id: number,
  payload: UpdateClassDocumentRequest,
): Promise<ClassDocumentResponse> {
  const response = await apiClient.put<ClassDocumentResponse>(
    `/class-documents/${id}`,
    payload,
  )
  return response.data
}

export async function deactivateClassDocument(id: number): Promise<void> {
  await apiClient.patch(`/class-documents/${id}/deactivate`)
}

export async function reactivateClassDocument(id: number): Promise<void> {
  await apiClient.patch(`/class-documents/${id}/reactivate`)
}

export async function deleteClassDocumentForever(id: number): Promise<void> {
  await apiClient.delete(`/class-documents/${id}/delete-forever`)
}
