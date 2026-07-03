import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  getClassSessions,
  getClassSessionById,
  createClassSession,
  updateClassSession,
  cancelClassSession,
  completeClassSession,
  reactivateClassSession,
  deleteClassSessionForever,
} from '../features/class-sessions/api'
import type {
  ClassMode,
  ClassSessionResponse,
  ClassSessionStatus,
  CreateClassSessionRequest,
  UpdateClassSessionRequest,
} from '../features/class-sessions/types'
import { getCourses } from '../features/courses/api'
import type { CourseResponse } from '../features/courses/types'
import { getTeachers } from '../features/teachers/api'
import type { TeacherResponse } from '../features/teachers/types'

type ClassSessionFormMode = 'create' | 'edit'
type RecordFilter = 'all' | 'active' | 'inactive'

type ClassSessionFormValues = {
  courseId: string
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

const classModeOptions: Array<{ value: ClassMode; label: string }> = [
  { value: 0, label: 'Physical' },
  { value: 1, label: 'Online' },
  { value: 2, label: 'Hybrid' },
]

const statusOptions: Array<{ value: ClassSessionStatus; label: string }> = [
  { value: 0, label: 'Scheduled' },
  { value: 1, label: 'Ongoing' },
  { value: 2, label: 'Completed' },
  { value: 3, label: 'Cancelled' },
]

const emptyFormValues: ClassSessionFormValues = {
  courseId: '',
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

function toOptionalString(value: string): string | null {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

function toClassSessionFormValues(
  session: ClassSessionResponse,
): ClassSessionFormValues {
  return {
    courseId: String(session.courseId),
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

function buildPayload(
  values: ClassSessionFormValues,
): CreateClassSessionRequest {
  return {
    courseId: Number(values.courseId),
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
    isActive: true,
  }
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

function getStatusLabel(status: ClassSessionStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? 'Unknown'
}

function getClassModeLabel(classMode: ClassMode) {
  return (
    classModeOptions.find((option) => option.value === classMode)?.label ??
    'Unknown'
  )
}

function getStatusBadgeClasses(status: ClassSessionStatus) {
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

function ClassSessionFormModal({
  courses,
  errorMessage,
  formValues,
  isLoadingDependencies,
  isLoadingSession,
  isSubmitting,
  mode,
  onChange,
  onClose,
  onSubmit,
  teachers,
}: {
  courses: CourseResponse[]
  errorMessage: string
  formValues: ClassSessionFormValues
  isLoadingDependencies: boolean
  isLoadingSession: boolean
  isSubmitting: boolean
  mode: ClassSessionFormMode
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  teachers: TeacherResponse[]
}) {
  const hasCourses = courses.length > 0
  const hasTeachers = teachers.length > 0
  const canSubmit = hasCourses && hasTeachers && !isSubmitting

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                {mode === 'create' ? 'Add Class Session' : 'Edit Class Session'}
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {mode === 'create'
                  ? 'Create a new class session'
                  : 'Update class session details'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Schedule classes, keep meeting details clear, and maintain a clean
                status flow for the Phase 1 admin experience.
              </p>
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

        {isLoadingSession || isLoadingDependencies ? (
          <div className="space-y-4 px-6 py-8 sm:px-8">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <form className="space-y-6 px-6 py-8 sm:px-8" onSubmit={onSubmit}>
            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">Session Setup</p>
                <p className="mt-1 text-sm text-slate-500">
                  Choose the course, teacher, time window, and session status.
                </p>
              </div>

              {!hasCourses ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No courses exist yet. Create a course before adding a class session.
                </div>
              ) : null}

              {!hasTeachers ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No teachers exist yet. Create a teacher before adding a class session.
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Course
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    disabled={!hasCourses}
                    name="courseId"
                    onChange={onChange}
                    required
                    value={formValues.courseId}
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Teacher
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    disabled={!hasTeachers}
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Title
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    name="title"
                    onChange={onChange}
                    required
                    value={formValues.title}
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Description
                  </span>
                  <textarea
                    className="min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    name="description"
                    onChange={onChange}
                    value={formValues.description}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Start Time
                  </span>
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
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    End Time
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    name="endTime"
                    onChange={onChange}
                    required
                    type="datetime-local"
                    value={formValues.endTime}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Class Mode
                  </span>
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
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Meeting Provider
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    name="meetingProvider"
                    onChange={onChange}
                    placeholder="Manual, Zoom, Google Meet"
                    value={formValues.meetingProvider}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Status
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    name="status"
                    onChange={onChange}
                    value={String(formValues.status)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Meeting URL
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    name="meetingUrl"
                    onChange={onChange}
                    type="url"
                    value={formValues.meetingUrl}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Meeting Password
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    name="meetingPassword"
                    onChange={onChange}
                    value={formValues.meetingPassword}
                  />
                </label>
              </div>
            </section>

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
                disabled={!canSubmit}
                type="submit"
              >
                {isSubmitting
                  ? mode === 'create'
                    ? 'Creating...'
                    : 'Saving...'
                  : mode === 'create'
                    ? 'Create Class Session'
                    : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export function ClassSessionsPage() {
  const queryClient = useQueryClient()
  const [searchValue, setSearchValue] = useState('')
  const [recordFilter, setRecordFilter] = useState<RecordFilter>('all')
  const [formMode, setFormMode] = useState<ClassSessionFormMode>('create')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null)
  const [formValues, setFormValues] = useState<ClassSessionFormValues>(emptyFormValues)
  const [formErrorMessage, setFormErrorMessage] = useState('')

  const classSessionsQuery = useQuery({
    queryKey: ['class-sessions'],
    queryFn: getClassSessions,
  })

  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  })

  const teachersQuery = useQuery({
    queryKey: ['teachers'],
    queryFn: getTeachers,
  })

  const selectedSessionQuery = useQuery({
    queryKey: ['class-sessions', selectedSessionId],
    queryFn: () => getClassSessionById(selectedSessionId as number),
    enabled: isModalOpen && formMode === 'edit' && selectedSessionId !== null,
  })

  useEffect(() => {
    if (selectedSessionQuery.data) {
      setFormValues(toClassSessionFormValues(selectedSessionQuery.data))
    }
  }, [selectedSessionQuery.data])

  const createClassSessionMutation = useMutation({
    mutationFn: createClassSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['class-sessions'] })
      closeModal()
    },
  })

  const updateClassSessionMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: UpdateClassSessionRequest
    }) => updateClassSession(id, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['class-sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['class-sessions', variables.id] }),
      ])
      closeModal()
    },
  })

  const cancelClassSessionMutation = useMutation({
    mutationFn: cancelClassSession,
    onSuccess: async (_, sessionId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['class-sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['class-sessions', sessionId] }),
      ])
    },
  })

  const completeClassSessionMutation = useMutation({
    mutationFn: completeClassSession,
    onSuccess: async (_, sessionId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['class-sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['class-sessions', sessionId] }),
      ])
    },
  })

  const reactivateClassSessionMutation = useMutation({
    mutationFn: reactivateClassSession,
    onSuccess: async (_, sessionId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['class-sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['class-sessions', sessionId] }),
      ])
    },
  })

  const deleteClassSessionForeverMutation = useMutation({
    mutationFn: deleteClassSessionForever,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['class-sessions'] })
    },
  })

  const filteredSessions = useMemo(() => {
    const sessions = classSessionsQuery.data ?? []
    const normalizedSearch = searchValue.trim().toLowerCase()

    if (!normalizedSearch) {
      return sessions.filter((session) =>
        recordFilter === 'all'
          ? true
          : recordFilter === 'active'
            ? session.isActive
            : !session.isActive,
      )
    }

    return sessions.filter((session) => {
      if (recordFilter === 'active' && !session.isActive) {
        return false
      }

      if (recordFilter === 'inactive' && session.isActive) {
        return false
      }

      return [
        session.title,
        session.courseName,
        session.teacherName,
        getStatusLabel(session.status),
        getClassModeLabel(session.classMode),
      ].some((field) => field.toLowerCase().includes(normalizedSearch))
    })
  }, [classSessionsQuery.data, recordFilter, searchValue])

  function openCreateModal() {
    setFormMode('create')
    setSelectedSessionId(null)
    setFormValues(emptyFormValues)
    setFormErrorMessage('')
    setIsModalOpen(true)
  }

  function openEditModal(sessionId: number) {
    setFormMode('edit')
    setSelectedSessionId(sessionId)
    setFormValues(emptyFormValues)
    setFormErrorMessage('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setSelectedSessionId(null)
    setFormValues(emptyFormValues)
    setFormErrorMessage('')
  }

  function handleFormChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]:
        name === 'classMode' || name === 'status'
          ? Number(value)
          : value,
    }))
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormErrorMessage('')

    if (!formValues.courseId) {
      setFormErrorMessage('Course is required.')
      return
    }

    if (!formValues.teacherId) {
      setFormErrorMessage('Teacher is required.')
      return
    }

    if (!formValues.title.trim()) {
      setFormErrorMessage('Title is required.')
      return
    }

    if (!formValues.startTime) {
      setFormErrorMessage('Start time is required.')
      return
    }

    if (!formValues.endTime) {
      setFormErrorMessage('End time is required.')
      return
    }

    if (new Date(formValues.endTime) <= new Date(formValues.startTime)) {
      setFormErrorMessage('End time must be after start time.')
      return
    }

    try {
      if (formMode === 'create') {
        await createClassSessionMutation.mutateAsync(buildPayload(formValues))
        return
      }

      if (selectedSessionId === null || !selectedSessionQuery.data) {
        setFormErrorMessage('Class session details are still loading. Please try again.')
        return
      }

      await updateClassSessionMutation.mutateAsync({
        id: selectedSessionId,
        payload: {
          ...buildPayload(formValues),
          isActive: selectedSessionQuery.data.isActive,
        },
      })
    } catch (error) {
      setFormErrorMessage(
        getErrorMessage(error, 'Unable to save class session details right now.'),
      )
    }
  }

  async function handleCancel(session: ClassSessionResponse) {
    const shouldCancel = window.confirm(`Cancel "${session.title}"?`)

    if (!shouldCancel) {
      return
    }

    try {
      await cancelClassSessionMutation.mutateAsync(session.id)
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to cancel the selected class session.'))
    }
  }

  async function handleComplete(session: ClassSessionResponse) {
    const shouldComplete = window.confirm(`Mark "${session.title}" as completed?`)

    if (!shouldComplete) {
      return
    }

    try {
      await completeClassSessionMutation.mutateAsync(session.id)
    } catch (error) {
      window.alert(
        getErrorMessage(error, 'Unable to mark the selected class session as completed.'),
      )
    }
  }

  async function handleReactivate(session: ClassSessionResponse) {
    const shouldReactivate = window.confirm(`Reactivate "${session.title}"?`)

    if (!shouldReactivate) {
      return
    }

    try {
      await reactivateClassSessionMutation.mutateAsync(session.id)
    } catch (error) {
      window.alert(
        getErrorMessage(error, 'Unable to reactivate the selected class session.'),
      )
    }
  }

  async function handleDeleteForever(session: ClassSessionResponse) {
    const shouldDelete = window.confirm(
      `Delete "${session.title}" forever? This cannot be undone.`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      await deleteClassSessionForeverMutation.mutateAsync(session.id)
    } catch (error) {
      window.alert(
        getErrorMessage(
          error,
          'Unable to permanently delete the selected class session.',
        ),
      )
    }
  }

  const isSubmitting =
    createClassSessionMutation.isPending || updateClassSessionMutation.isPending

  return (
    <>
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                Class Session Management
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                Schedule classes and keep session status clear
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Manage class times, manual meeting links, and completion or cancellation
                status from one clean Phase 1 scheduling table.
              </p>
            </div>

            <button
              className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
              onClick={openCreateModal}
              type="button"
            >
              Add Class Session
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">Session Directory</p>
              <p className="mt-1 text-sm text-slate-500">
                Filter by title, course, teacher, class mode, status, or record state.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 md:max-w-xl md:flex-row">
              <label className="block md:w-40">
                <span className="sr-only">Filter class sessions by record state</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  onChange={(event) => setRecordFilter(event.target.value as RecordFilter)}
                  value={recordFilter}
                >
                  <option value="all">All records</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

              <label className="block flex-1">
                <span className="sr-only">Search class sessions</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search class sessions"
                  value={searchValue}
                />
              </label>
            </div>
          </div>
        </div>

        {classSessionsQuery.isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
              />
            ))}
          </div>
        ) : classSessionsQuery.isError ? (
          <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
            <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
              Unable to Load
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Class session data could not be fetched
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Check that the API is running and try loading the class session list again.
            </p>
            <button
              className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => void classSessionsQuery.refetch()}
              type="button"
            >
              Retry Class Session Load
            </button>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Empty State
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              {searchValue || recordFilter !== 'all'
                ? 'No class sessions matched your search'
                : 'No class sessions found'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {searchValue || recordFilter !== 'all'
                ? 'Try a different title, course, teacher, class mode, status, or record state.'
                : 'Create the first class session to start managing the schedule.'}
            </p>
            {!searchValue && recordFilter === 'all' ? (
              <button
                className="mt-6 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                onClick={openCreateModal}
                type="button"
              >
                Add First Class Session
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-6 py-4">Session</th>
                    <th className="px-6 py-4">Course / Teacher</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Mode</th>
                    <th className="px-6 py-4">Meeting</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="align-top text-sm text-slate-700">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-950">{session.title}</p>
                        <p className="mt-1 max-w-xs text-slate-500">
                          {session.description || 'No description provided'}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-medium text-slate-950">{session.courseName}</p>
                        <p className="mt-1 text-slate-500">{session.teacherName}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p>{formatDateTime(session.startTime)}</p>
                        <p className="mt-1 text-slate-500">
                          Ends {formatDateTime(session.endTime)}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                          {getClassModeLabel(session.classMode)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p>{session.meetingProvider || 'No provider set'}</p>
                        {session.meetingUrl ? (
                          <a
                            className="mt-1 inline-flex text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
                            href={session.meetingUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Open meeting link
                          </a>
                        ) : (
                          <p className="mt-1 text-slate-500">No meeting link</p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClasses(
                              session.status,
                            )}`}
                          >
                            {getStatusLabel(session.status)}
                          </span>
                          <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                              session.isActive
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                : 'bg-slate-100 text-slate-700 ring-slate-200'
                            }`}
                          >
                            {session.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                            onClick={() => openEditModal(session.id)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={session.isActive || reactivateClassSessionMutation.isPending}
                            onClick={() => void handleReactivate(session)}
                            type="button"
                          >
                            Reactivate
                          </button>
                          <button
                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={
                              session.status === 3 || cancelClassSessionMutation.isPending
                            }
                            onClick={() => void handleCancel(session)}
                            type="button"
                          >
                            {session.status === 3 ? 'Cancelled' : 'Cancel'}
                          </button>
                          <button
                            className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={
                              session.status === 2 ||
                              session.status === 3 ||
                              completeClassSessionMutation.isPending
                            }
                            onClick={() => void handleComplete(session)}
                            type="button"
                          >
                            {session.status === 2 ? 'Completed' : 'Mark Completed'}
                          </button>
                          <button
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={deleteClassSessionForeverMutation.isPending}
                            onClick={() => void handleDeleteForever(session)}
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
          </div>
        )}
      </section>

      {isModalOpen ? (
        <ClassSessionFormModal
          courses={coursesQuery.data ?? []}
          errorMessage={formErrorMessage}
          formValues={formValues}
          isLoadingDependencies={coursesQuery.isLoading || teachersQuery.isLoading}
          isLoadingSession={selectedSessionQuery.isLoading}
          isSubmitting={isSubmitting}
          mode={formMode}
          onChange={handleFormChange}
          onClose={closeModal}
          onSubmit={handleFormSubmit}
          teachers={teachersQuery.data ?? []}
        />
      ) : null}
    </>
  )
}
