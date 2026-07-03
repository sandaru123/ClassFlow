import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  cancelClassSession,
  completeClassSession,
  getClassSessionById,
  reactivateClassSession,
  updateClassSession,
} from '../features/class-sessions/api'
import type {
  ClassMode,
  ClassSessionResponse,
  ClassSessionStatus,
  UpdateClassSessionRequest,
} from '../features/class-sessions/types'
import {
  deactivateClassDocument,
  deleteClassDocumentForever,
  downloadClassDocument,
  getClassDocumentsBySessionId,
  reactivateClassDocument,
  updateClassDocument,
  uploadClassDocument,
} from '../features/documents/api'
import type {
  ClassDocumentResponse,
  DocumentVisibilityType,
  UpdateClassDocumentRequest,
  UploadClassDocumentRequest,
} from '../features/documents/types'
import { getTeachers } from '../features/teachers/api'
import type { TeacherResponse } from '../features/teachers/types'

type PortalMode = 'admin' | 'teacher'
type SessionFormValues = {
  teacherId: string
  title: string
  description: string
  startTime: string
  endTime: string
  classMode: ClassMode
  meetingProvider: string
  meetingUrl: string
  meetingPassword: string
  status: ClassSessionStatus
}

type DocumentFormMode = 'upload' | 'edit'
type DocumentFormValues = {
  title: string
  description: string
  file: File | null
  visibilityType: DocumentVisibilityType
}

const classModeOptions: Array<{ value: ClassMode; label: string }> = [
  { value: 0, label: 'Physical' },
  { value: 1, label: 'Online' },
  { value: 2, label: 'Hybrid' },
]

const sessionStatusOptions: Array<{ value: ClassSessionStatus; label: string }> = [
  { value: 0, label: 'Scheduled' },
  { value: 1, label: 'Ongoing' },
  { value: 2, label: 'Completed' },
  { value: 3, label: 'Cancelled' },
]

const visibilityOptions: Array<{ value: DocumentVisibilityType; label: string }> = [
  { value: 0, label: 'Available Immediately' },
  { value: 1, label: 'Before Class' },
  { value: 2, label: 'During Class' },
  { value: 3, label: 'After Class' },
  { value: 4, label: 'After Teacher Marks Completed' },
]

const emptySessionFormValues: SessionFormValues = {
  teacherId: '',
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  classMode: 0,
  meetingProvider: '',
  meetingUrl: '',
  meetingPassword: '',
  status: 0,
}

const emptyDocumentFormValues: DocumentFormValues = {
  title: '',
  description: '',
  file: null,
  visibilityType: 0,
}

function toOptionalString(value: string): string | null {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (error.response?.status === 409) {
      return 'This record cannot be permanently deleted because it has related data. Please deactivate it instead.'
    }

    return error.response?.data?.message ?? fallbackMessage
  }

  return fallbackMessage
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getClassModeLabel(classMode: ClassMode) {
  return classModeOptions.find((option) => option.value === classMode)?.label ?? 'Unknown'
}

function getSessionStatusLabel(status: ClassSessionStatus) {
  return sessionStatusOptions.find((option) => option.value === status)?.label ?? 'Unknown'
}

function getSessionStatusBadgeClasses(status: ClassSessionStatus) {
  switch (status) {
    case 0:
      return 'bg-sky-50 text-sky-700 ring-sky-200'
    case 1:
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    case 2:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
    case 3:
      return 'bg-rose-50 text-rose-700 ring-rose-200'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
  }
}

function getVisibilityLabel(visibilityType: DocumentVisibilityType) {
  return visibilityOptions.find((option) => option.value === visibilityType)?.label ?? 'Unknown'
}

function getVisibilityBadgeClasses(visibilityType: DocumentVisibilityType) {
  switch (visibilityType) {
    case 0:
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    case 1:
      return 'bg-sky-50 text-sky-700 ring-sky-200'
    case 2:
      return 'bg-amber-50 text-amber-700 ring-amber-200'
    case 3:
      return 'bg-violet-50 text-violet-700 ring-violet-200'
    case 4:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
  }
}

function toSessionFormValues(session: ClassSessionResponse): SessionFormValues {
  return {
    teacherId: String(session.teacherId),
    title: session.title,
    description: session.description ?? '',
    startTime: session.startTime.slice(0, 16),
    endTime: session.endTime.slice(0, 16),
    classMode: session.classMode,
    meetingProvider: session.meetingProvider ?? '',
    meetingUrl: session.meetingUrl ?? '',
    meetingPassword: session.meetingPassword ?? '',
    status: session.status,
  }
}

function toDocumentFormValues(document: ClassDocumentResponse): DocumentFormValues {
  return {
    title: document.title,
    description: document.description ?? '',
    file: null,
    visibilityType: document.visibilityType,
  }
}

function buildSessionPayload(
  courseId: number,
  values: SessionFormValues,
  isActive: boolean,
): UpdateClassSessionRequest {
  return {
    courseId,
    teacherId: Number(values.teacherId),
    title: values.title.trim(),
    description: toOptionalString(values.description),
    startTime: new Date(values.startTime).toISOString(),
    endTime: new Date(values.endTime).toISOString(),
    classMode: values.classMode,
    meetingProvider: toOptionalString(values.meetingProvider),
    meetingUrl: toOptionalString(values.meetingUrl),
    meetingPassword: toOptionalString(values.meetingPassword),
    status: values.status,
    isActive,
  }
}

function buildUploadPayload(
  sessionId: number,
  values: DocumentFormValues,
): UploadClassDocumentRequest {
  return {
    classSessionId: sessionId,
    title: values.title.trim(),
    description: toOptionalString(values.description),
    file: values.file as File,
    visibilityType: values.visibilityType,
  }
}

function buildDocumentUpdatePayload(
  document: ClassDocumentResponse,
  values: DocumentFormValues,
): UpdateClassDocumentRequest {
  return {
    title: values.title.trim(),
    description: toOptionalString(values.description),
    visibilityType: values.visibilityType,
    isActive: document.isActive,
  }
}

function SessionFormModal({
  errorMessage,
  formValues,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
  teachers,
}: {
  errorMessage: string
  formValues: SessionFormValues
  isSubmitting: boolean
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  teachers: TeacherResponse[]
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Edit Session
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Update session details
              </h2>
            </div>

            <button
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        <form className="space-y-6 px-6 py-8 sm:px-8" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Teacher</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="teacherId"
                onChange={onChange}
                required
                value={formValues.teacherId}
              >
                <option value="">Select a teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="status"
                onChange={onChange}
                value={String(formValues.status)}
              >
                {sessionStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Title</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="title"
                onChange={onChange}
                required
                value={formValues.title}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="description"
                onChange={onChange}
                value={formValues.description}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Start Time</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="startTime"
                onChange={onChange}
                required
                type="datetime-local"
                value={formValues.startTime}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">End Time</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="endTime"
                onChange={onChange}
                required
                type="datetime-local"
                value={formValues.endTime}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Class Mode</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="classMode"
                onChange={onChange}
                value={String(formValues.classMode)}
              >
                {classModeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Meeting Provider</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="meetingProvider"
                onChange={onChange}
                value={formValues.meetingProvider}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Meeting URL</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="meetingUrl"
                onChange={onChange}
                type="url"
                value={formValues.meetingUrl}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Meeting Password</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="meetingPassword"
                onChange={onChange}
                value={formValues.meetingPassword}
              />
            </label>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-sky-300"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Saving...' : 'Save Session'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DocumentFormModal({
  errorMessage,
  formValues,
  isSubmitting,
  mode,
  onChange,
  onClose,
  onFileChange,
  onSubmit,
}: {
  errorMessage: string
  formValues: DocumentFormValues
  isSubmitting: boolean
  mode: DocumentFormMode
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void
  onClose: () => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                {mode === 'upload' ? 'Upload Document' : 'Edit Document'}
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {mode === 'upload' ? 'Add a class document' : 'Update document details'}
              </h2>
            </div>

            <button
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        <form className="space-y-6 px-6 py-8 sm:px-8" onSubmit={onSubmit}>
          <div className="grid gap-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Title</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="title"
                onChange={onChange}
                required
                value={formValues.title}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="description"
                onChange={onChange}
                value={formValues.description}
              />
            </label>

            {mode === 'upload' ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">File</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-800"
                  onChange={onFileChange}
                  type="file"
                />
              </label>
            ) : null}

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Visibility</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="visibilityType"
                onChange={onChange}
                value={String(formValues.visibilityType)}
              >
                {visibilityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-sky-300"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? mode === 'upload'
                  ? 'Uploading...'
                  : 'Saving...'
                : mode === 'upload'
                  ? 'Upload Document'
                  : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SessionDetailsWorkspace({ portal }: { portal: PortalMode }) {
  const queryClient = useQueryClient()
  const { courseId, sessionId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const parsedCourseId = Number(courseId)
  const parsedSessionId = Number(sessionId)
  const isAdmin = portal === 'admin'

  const [sessionFormValues, setSessionFormValues] = useState<SessionFormValues>(emptySessionFormValues)
  const [sessionFormErrorMessage, setSessionFormErrorMessage] = useState('')
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
  const [documentFormMode, setDocumentFormMode] = useState<DocumentFormMode>('upload')
  const [documentFormValues, setDocumentFormValues] = useState<DocumentFormValues>(emptyDocumentFormValues)
  const [documentFormErrorMessage, setDocumentFormErrorMessage] = useState('')
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<ClassDocumentResponse | null>(null)

  const sessionQuery = useQuery({
    queryKey: ['class-sessions', parsedSessionId],
    queryFn: () => getClassSessionById(parsedSessionId),
    enabled: Number.isFinite(parsedSessionId),
  })

  const documentsQuery = useQuery({
    queryKey: ['class-documents', 'session', parsedSessionId],
    queryFn: () => getClassDocumentsBySessionId(parsedSessionId),
    enabled: Number.isFinite(parsedSessionId),
  })

  const teachersQuery = useQuery({
    queryKey: ['teachers'],
    queryFn: getTeachers,
    enabled: isAdmin,
  })

  const session = sessionQuery.data
  const documents = documentsQuery.data ?? []
  const coursePath = isAdmin ? '/admin/courses' : '/teacher/courses'
  const attendancePath = isAdmin ? '/admin/attendance' : '/teacher/attendance'
  const teacherOptions: TeacherResponse[] =
    isAdmin
      ? teachersQuery.data ?? []
      : session
        ? [
            {
              id: session.teacherId,
              firstName: session.teacherName,
              lastName: '',
              email: null,
              hasLoginAccount: false,
              phoneNumber: null,
              address: null,
              isActive: true,
              createdAt: '',
              updatedAt: null,
            },
          ]
        : []

  useEffect(() => {
    if (searchParams.get('action') === 'upload' && sessionQuery.data) {
      setSelectedDocument(null)
      setDocumentFormMode('upload')
      setDocumentFormValues(emptyDocumentFormValues)
      setDocumentFormErrorMessage('')
      setIsDocumentModalOpen(true)
    }
  }, [searchParams, sessionQuery.data])

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateClassSessionRequest }) =>
      updateClassSession(id, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['class-sessions', parsedSessionId] }),
        queryClient.invalidateQueries({ queryKey: ['class-sessions', 'course', parsedCourseId] }),
        queryClient.invalidateQueries({ queryKey: ['teacher-portal', 'class-sessions'] }),
      ])
      closeSessionModal()
    },
  })

  const cancelSessionMutation = useMutation({
    mutationFn: cancelClassSession,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['class-sessions', parsedSessionId] }),
        queryClient.invalidateQueries({ queryKey: ['class-sessions', 'course', parsedCourseId] }),
        queryClient.invalidateQueries({ queryKey: ['teacher-portal', 'class-sessions'] }),
      ])
    },
  })

  const completeSessionMutation = useMutation({
    mutationFn: completeClassSession,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['class-sessions', parsedSessionId] }),
        queryClient.invalidateQueries({ queryKey: ['class-sessions', 'course', parsedCourseId] }),
        queryClient.invalidateQueries({ queryKey: ['teacher-portal', 'class-sessions'] }),
      ])
    },
  })

  const reactivateSessionMutation = useMutation({
    mutationFn: reactivateClassSession,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['class-sessions', parsedSessionId] }),
        queryClient.invalidateQueries({ queryKey: ['class-sessions', 'course', parsedCourseId] }),
        queryClient.invalidateQueries({ queryKey: ['teacher-portal', 'class-sessions'] }),
      ])
    },
  })

  const uploadDocumentMutation = useMutation({
    mutationFn: uploadClassDocument,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['class-documents', 'session', parsedSessionId] })
      closeDocumentModal()
    },
  })

  const updateDocumentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateClassDocumentRequest }) =>
      updateClassDocument(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['class-documents', 'session', parsedSessionId] })
      closeDocumentModal()
    },
  })

  const deactivateDocumentMutation = useMutation({
    mutationFn: deactivateClassDocument,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['class-documents', 'session', parsedSessionId] })
    },
  })

  const reactivateDocumentMutation = useMutation({
    mutationFn: reactivateClassDocument,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['class-documents', 'session', parsedSessionId] })
    },
  })

  const deleteDocumentForeverMutation = useMutation({
    mutationFn: deleteClassDocumentForever,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['class-documents', 'session', parsedSessionId] })
    },
  })

  function openSessionModal() {
    if (!sessionQuery.data) {
      return
    }

    setSessionFormValues(toSessionFormValues(sessionQuery.data))
    setSessionFormErrorMessage('')
    setIsSessionModalOpen(true)
  }

  function closeSessionModal() {
    setSessionFormValues(emptySessionFormValues)
    setSessionFormErrorMessage('')
    setIsSessionModalOpen(false)
  }

  function openUploadModal() {
    setSelectedDocument(null)
    setDocumentFormMode('upload')
    setDocumentFormValues(emptyDocumentFormValues)
    setDocumentFormErrorMessage('')
    setIsDocumentModalOpen(true)
  }

  function openEditDocumentModal(document: ClassDocumentResponse) {
    setSelectedDocument(document)
    setDocumentFormMode('edit')
    setDocumentFormValues(toDocumentFormValues(document))
    setDocumentFormErrorMessage('')
    setIsDocumentModalOpen(true)
  }

  function closeDocumentModal() {
    setSelectedDocument(null)
    setDocumentFormValues(emptyDocumentFormValues)
    setDocumentFormErrorMessage('')
    setIsDocumentModalOpen(false)
    if (searchParams.get('action') === 'upload') {
      const nextParams = new URLSearchParams(searchParams)
      nextParams.delete('action')
      setSearchParams(nextParams, { replace: true })
    }
  }

  function handleSessionFormChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target
    setSessionFormValues((currentValues) => ({
      ...currentValues,
      [name]:
        name === 'classMode' || name === 'status'
          ? Number(value)
          : value,
    }))
  }

  function handleDocumentFormChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target
    setDocumentFormValues((currentValues) => ({
      ...currentValues,
      [name]: name === 'visibilityType' ? Number(value) : value,
    }))
  }

  function handleDocumentFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    setDocumentFormValues((currentValues) => ({
      ...currentValues,
      file,
    }))
  }

  async function handleSessionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSessionFormErrorMessage('')

    const session = sessionQuery.data
    if (!session) {
      setSessionFormErrorMessage('Session details are still loading.')
      return
    }

    if (!sessionFormValues.teacherId) {
      setSessionFormErrorMessage('Teacher is required.')
      return
    }

    if (!sessionFormValues.title.trim()) {
      setSessionFormErrorMessage('Title is required.')
      return
    }

    if (new Date(sessionFormValues.endTime) <= new Date(sessionFormValues.startTime)) {
      setSessionFormErrorMessage('End time must be after start time.')
      return
    }

    try {
      await updateSessionMutation.mutateAsync({
        id: session.id,
        payload: buildSessionPayload(session.courseId, sessionFormValues, session.isActive),
      })
    } catch (error) {
      setSessionFormErrorMessage(getErrorMessage(error, 'Unable to save class session details right now.'))
    }
  }

  async function handleDocumentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDocumentFormErrorMessage('')

    if (!documentFormValues.title.trim()) {
      setDocumentFormErrorMessage('Title is required.')
      return
    }

    try {
      if (documentFormMode === 'upload') {
        if (!documentFormValues.file) {
          setDocumentFormErrorMessage('A file is required.')
          return
        }

        await uploadDocumentMutation.mutateAsync(
          buildUploadPayload(parsedSessionId, documentFormValues),
        )
        return
      }

      if (!selectedDocument) {
        setDocumentFormErrorMessage('Document details are still loading.')
        return
      }

      await updateDocumentMutation.mutateAsync({
        id: selectedDocument.id,
        payload: buildDocumentUpdatePayload(selectedDocument, documentFormValues),
      })
    } catch (error) {
      setDocumentFormErrorMessage(getErrorMessage(error, 'Unable to save document details right now.'))
    }
  }

  async function handleCancelSession() {
    const session = sessionQuery.data
    if (!session) {
      return
    }

    const shouldCancel = window.confirm(`Cancel "${session.title}"?`)
    if (!shouldCancel) {
      return
    }

    try {
      await cancelSessionMutation.mutateAsync(session.id)
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to cancel the selected class session.'))
    }
  }

  async function handleCompleteSession() {
    const session = sessionQuery.data
    if (!session) {
      return
    }

    const shouldComplete = window.confirm(`Mark "${session.title}" as completed?`)
    if (!shouldComplete) {
      return
    }

    try {
      await completeSessionMutation.mutateAsync(session.id)
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to mark the selected class session as completed.'))
    }
  }

  async function handleReactivateSession() {
    const session = sessionQuery.data
    if (!session) {
      return
    }

    const shouldReactivate = window.confirm(`Reactivate "${session.title}"?`)
    if (!shouldReactivate) {
      return
    }

    try {
      await reactivateSessionMutation.mutateAsync(session.id)
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to reactivate the selected class session.'))
    }
  }

  async function handleDownloadDocument(documentItem: ClassDocumentResponse) {
    try {
      const blob = await downloadClassDocument(documentItem.id)
      const objectUrl = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = objectUrl
      link.download = documentItem.originalFileName
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      URL.revokeObjectURL(objectUrl)
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to download the selected document.'))
    }
  }

  async function handleDeactivateDocument(document: ClassDocumentResponse) {
    const shouldDeactivate = window.confirm(`Deactivate "${document.title}"?`)
    if (!shouldDeactivate) {
      return
    }

    try {
      await deactivateDocumentMutation.mutateAsync(document.id)
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to deactivate the selected document.'))
    }
  }

  async function handleReactivateDocument(document: ClassDocumentResponse) {
    const shouldReactivate = window.confirm(`Reactivate "${document.title}"?`)
    if (!shouldReactivate) {
      return
    }

    try {
      await reactivateDocumentMutation.mutateAsync(document.id)
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to reactivate the selected document.'))
    }
  }

  async function handleDeleteDocumentForever(document: ClassDocumentResponse) {
    const shouldDelete = window.confirm(`Delete "${document.title}" forever? This cannot be undone.`)
    if (!shouldDelete) {
      return
    }

    try {
      await deleteDocumentForeverMutation.mutateAsync(document.id)
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to permanently delete the selected document.'))
    }
  }

  if (!Number.isFinite(parsedCourseId) || !Number.isFinite(parsedSessionId)) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        Invalid session route.
      </div>
    )
  }

  if (sessionQuery.isLoading || documentsQuery.isLoading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
          />
        ))}
      </div>
    )
  }

  if (sessionQuery.isError || documentsQuery.isError || !sessionQuery.data) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
          Unable to Load
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          Session details could not be loaded
        </h1>
      </div>
    )
  }

  const sessionData = sessionQuery.data

  return (
    <>
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  className="text-sm font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
                  to={`${coursePath}/${parsedCourseId}`}
                >
                  Back to Course
                </Link>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getSessionStatusBadgeClasses(sessionData.status)}`}>
                  {getSessionStatusLabel(sessionData.status)}
                </span>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${sessionData.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
                  {sessionData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                {sessionData.title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {sessionData.description || 'No session description provided.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                onClick={openSessionModal}
                type="button"
              >
                Edit Session
              </button>
              <button
                className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={sessionData.status === 3 || cancelSessionMutation.isPending}
                onClick={() => void handleCancelSession()}
                type="button"
              >
                Cancel
              </button>
              <button
                className="rounded-2xl border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={sessionData.status === 2 || sessionData.status === 3 || completeSessionMutation.isPending}
                onClick={() => void handleCompleteSession()}
                type="button"
              >
                Complete
              </button>
              <button
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={sessionData.status !== 3 || reactivateSessionMutation.isPending}
                onClick={() => void handleReactivateSession()}
                type="button"
              >
                Reactivate
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Course</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {sessionData.courseName}
            </p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Teacher</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {sessionData.teacherName}
            </p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Mode</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {getClassModeLabel(sessionData.classMode)}
            </p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Documents</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {documents.length}
            </p>
          </article>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Session details</h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-sm font-medium text-slate-500">Starts</dt>
                <dd className="mt-2 text-sm font-semibold text-slate-950">{formatDateTime(sessionData.startTime)}</dd>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-sm font-medium text-slate-500">Ends</dt>
                <dd className="mt-2 text-sm font-semibold text-slate-950">{formatDateTime(sessionData.endTime)}</dd>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-sm font-medium text-slate-500">Meeting Provider</dt>
                <dd className="mt-2 text-sm font-semibold text-slate-950">{sessionData.meetingProvider || 'No provider set'}</dd>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <dt className="text-sm font-medium text-slate-500">Meeting Password</dt>
                <dd className="mt-2 text-sm font-semibold text-slate-950">{sessionData.meetingPassword || 'Not set'}</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Shortcuts</h2>
              <div className="mt-5 flex flex-col gap-3">
              {sessionData.meetingUrl ? (
                <a
                  className="rounded-2xl bg-sky-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-sky-600"
                  href={sessionData.meetingUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open Meeting Link
                </a>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
                  No meeting link has been added yet.
                </div>
              )}
              <Link
                className="rounded-2xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                to={attendancePath}
              >
                Attendance Shortcut
              </Link>
              <button
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                onClick={openUploadModal}
                type="button"
              >
                Upload Document
              </button>
            </div>
          </article>
        </div>

        <section id="documents" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Documents for this session</h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload, update metadata, and control visibility timing directly inside the session workspace.
              </p>
            </div>

            <button
              className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
              onClick={openUploadModal}
              type="button"
            >
              Upload Document
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
              <h3 className="text-lg font-semibold text-slate-950">No documents uploaded yet</h3>
              <p className="mt-2 text-sm text-slate-600">
                Upload the first class document to keep session materials attached to the session itself.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">File</th>
                    <th className="px-4 py-3">Visibility</th>
                    <th className="px-4 py-3">Uploaded</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((documentItem) => (
                    <tr key={documentItem.id} className="align-top text-sm text-slate-700">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-950">{documentItem.title}</p>
                        <p className="mt-1 max-w-xs text-slate-500">
                          {documentItem.description || 'No description provided'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p>{documentItem.originalFileName}</p>
                        <p className="mt-1 text-slate-500">
                          {documentItem.fileType || 'Unknown'} • {formatFileSize(documentItem.fileSizeInBytes)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getVisibilityBadgeClasses(documentItem.visibilityType)}`}>
                          {getVisibilityLabel(documentItem.visibilityType)}
                        </span>
                      </td>
                      <td className="px-4 py-4">{formatDateTime(documentItem.uploadedAt)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${documentItem.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
                          {documentItem.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                            onClick={() => openEditDocumentModal(documentItem)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                            onClick={() => void handleDownloadDocument(documentItem)}
                            type="button"
                          >
                            Download
                          </button>
                          <button
                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={!documentItem.isActive || deactivateDocumentMutation.isPending}
                            onClick={() => void handleDeactivateDocument(documentItem)}
                            type="button"
                          >
                            Deactivate
                          </button>
                          <button
                            className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={documentItem.isActive || reactivateDocumentMutation.isPending}
                            onClick={() => void handleReactivateDocument(documentItem)}
                            type="button"
                          >
                            Reactivate
                          </button>
                          <button
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={deleteDocumentForeverMutation.isPending}
                            onClick={() => void handleDeleteDocumentForever(documentItem)}
                            type="button"
                          >
                            Delete Forever
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {isSessionModalOpen ? (
        <SessionFormModal
          errorMessage={sessionFormErrorMessage}
          formValues={sessionFormValues}
          isSubmitting={updateSessionMutation.isPending}
          onChange={handleSessionFormChange}
          onClose={closeSessionModal}
          onSubmit={handleSessionSubmit}
          teachers={teacherOptions}
        />
      ) : null}

      {isDocumentModalOpen ? (
        <DocumentFormModal
          errorMessage={documentFormErrorMessage}
          formValues={documentFormValues}
          isSubmitting={uploadDocumentMutation.isPending || updateDocumentMutation.isPending}
          mode={documentFormMode}
          onChange={handleDocumentFormChange}
          onClose={closeDocumentModal}
          onFileChange={handleDocumentFileChange}
          onSubmit={handleDocumentSubmit}
        />
      ) : null}
    </>
  )
}

export function AdminSessionDetailsPage() {
  return <SessionDetailsWorkspace portal="admin" />
}

export function TeacherSessionDetailsPage() {
  return <SessionDetailsWorkspace portal="teacher" />
}
