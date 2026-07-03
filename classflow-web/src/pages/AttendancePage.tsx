import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { bulkMarkAttendance, getAttendanceBySessionId } from '../features/attendance/api'
import type {
  AttendanceResponse,
  AttendanceStatus,
  BulkAttendanceItemRequest,
} from '../features/attendance/types'
import { getClassSessions } from '../features/class-sessions/api'
import { getEnrollmentsByCourseId } from '../features/enrollments/api'
import type { EnrollmentResponse } from '../features/enrollments/types'

type AttendanceRow = {
  studentId: number
  studentName: string
  attendanceId: number | null
  status: AttendanceStatus
  notes: string
  hasExistingRecord: boolean
  markedAt: string | null
}

const attendanceStatusOptions: Array<{
  value: AttendanceStatus
  label: string
}> = [
  { value: 0, label: 'Present' },
  { value: 1, label: 'Absent' },
  { value: 2, label: 'Late' },
  { value: 3, label: 'Excused' },
]

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
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

function getStatusLabel(status: AttendanceStatus) {
  return (
    attendanceStatusOptions.find((option) => option.value === status)?.label ??
    'Unknown'
  )
}

function getStatusBadgeClasses(status: AttendanceStatus) {
  switch (status) {
    case 0:
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    case 1:
      return 'bg-rose-50 text-rose-700 ring-rose-200'
    case 2:
      return 'bg-amber-50 text-amber-700 ring-amber-200'
    case 3:
      return 'bg-sky-50 text-sky-700 ring-sky-200'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
  }
}

function buildAttendanceRows(
  enrollments: EnrollmentResponse[],
  existingAttendance: AttendanceResponse[],
): AttendanceRow[] {
  return enrollments
    .filter((enrollment) => enrollment.isActive)
    .map((enrollment) => {
      const matchingAttendance = existingAttendance.find(
        (item) => item.studentId === enrollment.studentId,
      )

      return {
        studentId: enrollment.studentId,
        studentName: enrollment.studentName,
        attendanceId: matchingAttendance?.id ?? null,
        status: matchingAttendance?.status ?? 0,
        notes: matchingAttendance?.notes ?? '',
        hasExistingRecord: matchingAttendance != null,
        markedAt: matchingAttendance?.markedAt ?? null,
      }
    })
    .sort((left, right) => left.studentName.localeCompare(right.studentName))
}

export function AttendancePage() {
  const queryClient = useQueryClient()
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [formErrorMessage, setFormErrorMessage] = useState('')

  const classSessionsQuery = useQuery({
    queryKey: ['class-sessions'],
    queryFn: getClassSessions,
  })

  const selectedSession = useMemo(() => {
    if (!selectedSessionId) {
      return null
    }

    return (
      classSessionsQuery.data?.find(
        (session) => session.id === Number(selectedSessionId),
      ) ?? null
    )
  }, [classSessionsQuery.data, selectedSessionId])

  const attendanceBySessionQuery = useQuery({
    queryKey: ['attendance', 'session', selectedSession?.id],
    queryFn: () => getAttendanceBySessionId(selectedSession!.id),
    enabled: selectedSession != null,
  })

  const enrollmentsByCourseQuery = useQuery({
    queryKey: ['enrollments', 'course', selectedSession?.courseId],
    queryFn: () => getEnrollmentsByCourseId(selectedSession!.courseId),
    enabled: selectedSession != null,
  })

  useEffect(() => {
    if (!selectedSession) {
      setRows([])
      return
    }

    if (attendanceBySessionQuery.data && enrollmentsByCourseQuery.data) {
      setRows(
        buildAttendanceRows(
          enrollmentsByCourseQuery.data,
          attendanceBySessionQuery.data,
        ),
      )
    }
  }, [
    attendanceBySessionQuery.data,
    enrollmentsByCourseQuery.data,
    selectedSession,
  ])

  const bulkMarkAttendanceMutation = useMutation({
    mutationFn: ({
      classSessionId,
      items,
    }: {
      classSessionId: number
      items: BulkAttendanceItemRequest[]
    }) => bulkMarkAttendance({ classSessionId, items }),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['attendance', 'session', variables.classSessionId],
        }),
        queryClient.invalidateQueries({ queryKey: ['attendance'] }),
      ])
    },
  })

  function handleSessionChange(event: ChangeEvent<HTMLSelectElement>) {
    setSelectedSessionId(event.target.value)
    setFormErrorMessage('')
  }

  function handleStatusChange(studentId: number, status: AttendanceStatus) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.studentId === studentId ? { ...row, status } : row,
      ),
    )
  }

  function markAllPresent() {
    setRows((currentRows) =>
      currentRows.map((row) => ({ ...row, status: 0 })),
    )
  }

  async function saveAttendance() {
    setFormErrorMessage('')

    if (!selectedSession) {
      setFormErrorMessage('Select a class session first.')
      return
    }

    if (rows.length === 0) {
      setFormErrorMessage('There are no enrolled students to mark for this session.')
      return
    }

    try {
      await bulkMarkAttendanceMutation.mutateAsync({
        classSessionId: selectedSession.id,
        items: rows.map((row) => ({
          studentId: row.studentId,
          status: row.status,
          notes: row.notes.trim() ? row.notes.trim() : null,
        })),
      })
    } catch (error) {
      setFormErrorMessage(
        getErrorMessage(error, 'Unable to save attendance right now.'),
      )
    }
  }

  const isLoadingAttendanceData =
    selectedSession != null &&
    (attendanceBySessionQuery.isLoading || enrollmentsByCourseQuery.isLoading)

  const attendanceLoadError =
    selectedSession != null &&
    (attendanceBySessionQuery.isError || enrollmentsByCourseQuery.isError)

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Attendance Management
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Mark attendance by class session
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Select a class session, review enrolled students, mark statuses
              quickly, and save attendance in one clear Phase 1 workflow.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={rows.length === 0 || bulkMarkAttendanceMutation.isPending}
              onClick={markAllPresent}
              type="button"
            >
              Mark All Present
            </button>
            <button
              className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-sky-300"
              disabled={rows.length === 0 || bulkMarkAttendanceMutation.isPending}
              onClick={() => void saveAttendance()}
              type="button"
            >
              {bulkMarkAttendanceMutation.isPending
                ? 'Saving...'
                : 'Save Attendance'}
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">
              Class Session
            </span>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
              onChange={handleSessionChange}
              value={selectedSessionId}
            >
              <option value="">Select a class session</option>
              {(classSessionsQuery.data ?? []).map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title} · {session.courseName} ·{' '}
                  {formatDateTime(session.startTime)}
                </option>
              ))}
            </select>
          </label>

          {selectedSession ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <p className="text-sm font-semibold text-slate-950">
                {selectedSession.title}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {selectedSession.courseName} · {selectedSession.teacherName}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {formatDateTime(selectedSession.startTime)} to{' '}
                {formatDateTime(selectedSession.endTime)}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
              Select a class session to load enrolled students and existing attendance.
            </div>
          )}
        </div>
      </div>

      {classSessionsQuery.isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 4 }, (_, index) => (
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
            Retry Session Load
          </button>
        </div>
      ) : !selectedSession ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Empty State
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Select a class session to begin
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Choose a class session above to load enrolled students and mark attendance.
          </p>
        </div>
      ) : isLoadingAttendanceData ? (
        <div className="grid gap-4">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
            />
          ))}
        </div>
      ) : attendanceLoadError ? (
        <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
          <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
            Unable to Load
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            Attendance data could not be fetched
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Try loading the selected class session again.
          </p>
          <button
            className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => {
              void attendanceBySessionQuery.refetch()
              void enrollmentsByCourseQuery.refetch()
            }}
            type="button"
          >
            Retry Attendance Load
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Empty State
          </span>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
            No enrolled students found for this session
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Enroll students in the related course before marking attendance for this
            class session.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <p className="text-sm font-semibold text-slate-950">Attendance Table</p>
            <p className="mt-1 text-sm text-slate-500">
              Existing attendance records are loaded automatically and will be
              updated in bulk when you save.
            </p>
          </div>

          {formErrorMessage ? (
            <div className="border-b border-rose-200 bg-rose-50 px-6 py-3 text-sm text-rose-700">
              {formErrorMessage}
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-6 py-4">Student</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Record State</th>
                  <th className="px-6 py-4">Last Marked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.studentId} className="align-top text-sm text-slate-700">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-950">{row.studentName}</p>
                      <p className="mt-1 text-slate-500">Student ID: {row.studentId}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-3">
                        <select
                          className="w-full min-w-40 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                          onChange={(event) =>
                            handleStatusChange(
                              row.studentId,
                              Number(event.target.value) as AttendanceStatus,
                            )
                          }
                          value={String(row.status)}
                        >
                          {attendanceStatusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <span
                          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClasses(
                            row.status,
                          )}`}
                        >
                          {getStatusLabel(row.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                          row.hasExistingRecord
                            ? 'bg-sky-50 text-sky-700 ring-sky-200'
                            : 'bg-slate-100 text-slate-700 ring-slate-200'
                        }`}
                      >
                        {row.hasExistingRecord ? 'Existing record' : 'New record'}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {row.markedAt ? formatDateTime(row.markedAt) : 'Not marked yet'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
