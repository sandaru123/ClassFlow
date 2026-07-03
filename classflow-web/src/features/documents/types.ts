export type DocumentVisibilityType = 0 | 1 | 2 | 3 | 4

export type ClassDocumentResponse = {
  id: number
  classSessionId: number
  classSessionTitle: string
  title: string
  description: string | null
  originalFileName: string
  storedFileName: string
  storagePath: string
  fileType: string | null
  fileSizeInBytes: number
  visibilityType: DocumentVisibilityType
  isActive: boolean
  uploadedByUserId: string | null
  uploadedAt: string
  updatedAt: string | null
}

export type UploadClassDocumentRequest = {
  classSessionId: number
  title: string
  description: string | null
  file: File
  visibilityType: DocumentVisibilityType
}

export type UpdateClassDocumentRequest = {
  title: string
  description: string | null
  visibilityType: DocumentVisibilityType
  isActive: boolean
}
