import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import {
  cancelClassSession,
  completeClassSession,
  createClassSession,
  getClassSessionsByCourseId,
  reactivateClassSession,
  updateClassSession,
} from '../features/class-sessions/api'
import type {
  ClassMode,
  ClassSessionResponse,
  ClassSessionStatus,
  CreateClassSessionRequest,
  UpdateClassSessionRequest,
} from '../features/class-sessions/types'
import {
  getCourseById,
  reactivateCourse,
  deactivateCourse,
  updateCourse,
} from '../features/courses/api'
import type {
  CourseResponse,
  UpdateCourseRequest,
} from '../features/courses/types'
import {
  createEnrollment,
  deactivateEnrollment,
  getEnrollmentsByCourseId,
  reactivateEnrollment,
  updateEnrollment,
} from '../features/enrollments/api'
import type {
  CreateEnrollmentRequest,
  EnrollmentResponse,
  EnrollmentStatus,
  UpdateEnrollmentRequest,
} from '../features/enrollments/types'
import { getPaymentsByCourseId } from '../features/payments/api'
import type { PaymentResponse } from '../features/payments/types'
import { getStudents } from '../features/students/api'
import type { StudentResponse } from '../features/students/types'
import { getTeachers } from '../features/teachers/api'
import { getMyTeacherClassSessions, getMyTeacherCourses, getMyTeacherStudents } from '../features/teacher-portal/api'
import type {
  TeacherClassSessionResponse,
  TeacherCourseResponse,
} from '../features/teacher-portal/types'
import type { TeacherResponse } from '../features/teachers/types'

type PortalMode = 'admin' | 'teacher'
type CourseTab = 'overview' | 'students' | 'sessions' | 'payments'
type SessionFormMode = 'create' | 'edit'
type EnrollmentFormMode = 'create' | 'edit'

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

type EnrollmentFormValues = {
  studentId: string
  enrolledAt: string
  status: EnrollmentStatus
}

type CourseFormValues = {
  name: string
  description: string
  teacherId: string
  monthlyFee: string
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

const enrollmentStatusOptions: Array<{ value: EnrollmentStatus; label: string }> = [
  { value: 0, label: 'Active' },
  { value: 1, label: 'Completed' },
  { value: 2, label: 'Dropped' },
  { value: 3, label: 'Cancelled' },
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

const emptyEnrollmentFormValues: EnrollmentFormValues = {
  studentId: '',
  enrolledAt: '',
  status: 0,
}

const emptyCourseFormValues: CourseFormValues = {
  name: '',
  description: '',
  teacherId: '',
  monthlyFee: '',
}

function toOptionalString(value: string): string | null {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

function toOptionalNumber(value: string): number | null {
  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return null
  }

  return Number(trimmedValue)
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  }).format(value)
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

function getEnrollmentStatusLabel(status: EnrollmentStatus) {
  return (
    enrollmentStatusOptions.find((option) => option.value === status)?.label ??
    'Unknown'
  )
}

function getEnrollmentStatusBadgeClasses(status: EnrollmentStatus) {
  switch (status) {
    case 0:
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    case 1:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
    case 2:
      return 'bg-amber-50 text-amber-700 ring-amber-200'
    case 3:
      return 'bg-rose-50 text-rose-700 ring-rose-200'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
  }
}

function getPaymentStatusLabel(status: number) {
  switch (status) {
    case 0:
      return 'Pending'
    case 1:
      return 'Partially Paid'
    case 2:
      return 'Paid'
    case 3:
      return 'Overdue'
    case 4:
      return 'Cancelled'
    default:
      return 'Unknown'
  }
}

function getPaymentStatusBadgeClasses(status: number) {
  switch (status) {
    case 0:
      return 'bg-amber-50 text-amber-700 ring-amber-200'
    case 1:
      return 'bg-sky-50 text-sky-700 ring-sky-200'
    case 2:
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    case 3:
      return 'bg-rose-50 text-rose-700 ring-rose-200'
    case 4:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
  }
}

function toSessionFormValues(session: ClassSessionResponse | TeacherClassSessionResponse): SessionFormValues {
  const teacherId = 'teacherId' in session ? String(session.teacherId) : ''

  return {
    teacherId,
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

function toEnrollmentFormValues(enrollment: EnrollmentResponse): EnrollmentFormValues {
  return {
    studentId: String(enrollment.studentId),
    enrolledAt: enrollment.enrolledAt.slice(0, 16),
    status: enrollment.status,
  }
}

function toCourseFormValues(course: CourseResponse): CourseFormValues {
  return {
    name: course.name,
    description: course.description ?? '',
    teacherId: course.teacherId ? String(course.teacherId) : '',
    monthlyFee: String(course.monthlyFee),
  }
}

function buildSessionPayload(
  courseId: number,
  values: SessionFormValues,
  isActive = true,
): CreateClassSessionRequest | UpdateClassSessionRequest {
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

function buildEnrollmentPayload(
  courseId: number,
  values: EnrollmentFormValues,
  isActive = true,
): CreateEnrollmentRequest | UpdateEnrollmentRequest {
  const enrolledAt = values.enrolledAt
    ? new Date(values.enrolledAt).toISOString()
    : null

  if (isActive === true && enrolledAt === null) {
    return {
      studentId: Number(values.studentId),
      courseId,
      enrolledAt: null,
      status: values.status,
    }
  }

  return {
    studentId: Number(values.studentId),
    courseId,
    enrolledAt: enrolledAt ?? new Date().toISOString(),
    status: values.status,
    isActive,
  }
}

function buildCourseUpdatePayload(
  values: CourseFormValues,
  course: CourseResponse,
): UpdateCourseRequest {
  return {
    name: values.name.trim(),
    description: toOptionalString(values.description),
    teacherId: toOptionalNumber(values.teacherId),
    monthlyFee: Number(values.monthlyFee),
    isActive: course.isActive,
  }
}

function hasExactRole(roles: string[], role: 'SuperAdmin' | 'Admin' | 'Teacher' | 'Student') {
  return roles.includes(role)
}

function SessionFormModal({
  courseName,
  errorMessage,
  fixedTeacherLabel,
  formValues,
  isSubmitting,
  mode,
  onChange,
  onClose,
  onSubmit,
  teachers,
}: {
  courseName: string
  errorMessage: string
  fixedTeacherLabel?: string
  formValues: SessionFormValues
  isSubmitting: boolean
  mode: SessionFormMode
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  teachers: TeacherResponse[]
}) {
  const hasTeacherSelection = fixedTeacherLabel === undefined
  const hasTeachers = teachers.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                {mode === 'create' ? 'Add Session' : 'Edit Session'}
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {mode === 'create' ? 'Schedule a class session' : 'Update class session'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Manage sessions directly inside {courseName} so scheduling and class materials stay together.
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

        <form className="space-y-6 px-6 py-8 sm:px-8" onSubmit={onSubmit}>
          <section className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-medium text-slate-500">Course</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{courseName}</p>
            </div>

            {hasTeacherSelection ? (
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Teacher</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  name="teacherId"
                  onChange={onChange}
                  required
                  value={formValues.teacherId}
                >
                  <option value="">{hasTeachers ? 'Select a teacher' : 'No teachers available'}</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </option>
                  ))}
                </select>
                {!hasTeachers ? (
                  <p className="mt-2 text-sm text-amber-700">
                    Add or assign a teacher before creating a session for this course.
                  </p>
                ) : null}
              </label>
            ) : (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-medium text-slate-500">Teacher</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{fixedTeacherLabel}</p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
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

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Meeting Provider</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  name="meetingProvider"
                  onChange={onChange}
                  placeholder="Manual, Zoom, Google Meet"
                  value={formValues.meetingProvider}
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

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Meeting URL</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  name="meetingUrl"
                  onChange={onChange}
                  type="url"
                  value={formValues.meetingUrl}
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
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? mode === 'create'
                  ? 'Creating...'
                  : 'Saving...'
                : mode === 'create'
                  ? 'Create Session'
                  : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EnrollmentFormModal({
  courseName,
  errorMessage,
  formValues,
  isSubmitting,
  mode,
  onChange,
  onClose,
  onSubmit,
  students,
}: {
  courseName: string
  errorMessage: string
  formValues: EnrollmentFormValues
  isSubmitting: boolean
  mode: EnrollmentFormMode
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  students: StudentResponse[]
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                {mode === 'create' ? 'Add Enrollment' : 'Edit Enrollment'}
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {mode === 'create' ? 'Manage enrolled students' : 'Update enrollment'}
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
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-sm font-medium text-slate-500">Course</p>
            <p className="mt-1 text-lg font-semibold text-slate-950">{courseName}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-sm font-medium text-slate-700">Student</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="studentId"
                onChange={onChange}
                required
                value={formValues.studentId}
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Enrolled At</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="enrolledAt"
                onChange={onChange}
                type="datetime-local"
                value={formValues.enrolledAt}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Status</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="status"
                onChange={onChange}
                value={String(formValues.status)}
              >
                {enrollmentStatusOptions.map((option) => (
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
              {isSubmitting ? 'Saving...' : mode === 'create' ? 'Add Student' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CourseFormModal({
  errorMessage,
  formValues,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
  teachers,
}: {
  errorMessage: string
  formValues: CourseFormValues
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
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Edit Course
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Update course details
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
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Course Name</span>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
              name="name"
              onChange={onChange}
              required
              value={formValues.name}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
            <textarea
              className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
              name="description"
              onChange={onChange}
              value={formValues.description}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Assigned Teacher</span>
              <select
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="teacherId"
                onChange={onChange}
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
              <span className="mb-2 block text-sm font-medium text-slate-700">Monthly Fee</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                min="0"
                name="monthlyFee"
                onChange={onChange}
                required
                step="0.01"
                type="number"
                value={formValues.monthlyFee}
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
              {isSubmitting ? 'Saving...' : 'Save Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CourseDetailsWorkspace({ portal }: { portal: PortalMode }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { courseId } = useParams()
  const parsedCourseId = Number(courseId)
  const isAdmin = portal === 'admin'
  const roles = user?.roles ?? []
  const hasSuperAdminRole = hasExactRole(roles, 'SuperAdmin')
  const hasAdminRole = hasExactRole(roles, 'Admin')
  const hasTeacherRole = hasExactRole(roles, 'Teacher')
  const canManageAdminCourse = hasSuperAdminRole || hasAdminRole
  const canCreateSessions = isAdmin ? canManageAdminCourse : hasTeacherRole
  const sessionQueryKey = isAdmin
    ? ['class-sessions', 'course', parsedCourseId]
    : ['teacher-portal', 'class-sessions']

  const [activeTab, setActiveTab] = useState<CourseTab>('overview')
  const [sessionFormMode, setSessionFormMode] = useState<SessionFormMode>('create')
  const [sessionFormValues, setSessionFormValues] = useState<SessionFormValues>(emptySessionFormValues)
  const [sessionFormErrorMessage, setSessionFormErrorMessage] = useState('')
  const [selectedSession, setSelectedSession] = useState<ClassSessionResponse | TeacherClassSessionResponse | null>(null)
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentResponse | null>(null)
  const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false)
  const [enrollmentFormMode, setEnrollmentFormMode] = useState<EnrollmentFormMode>('create')
  const [enrollmentFormValues, setEnrollmentFormValues] = useState<EnrollmentFormValues>(emptyEnrollmentFormValues)
  const [enrollmentFormErrorMessage, setEnrollmentFormErrorMessage] = useState('')
  const [courseFormValues, setCourseFormValues] = useState<CourseFormValues>(emptyCourseFormValues)
  const [courseFormErrorMessage, setCourseFormErrorMessage] = useState('')
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)

  const adminCourseQuery = useQuery({
    queryKey: ['courses', parsedCourseId],
    queryFn: () => getCourseById(parsedCourseId),
    enabled: isAdmin && Number.isFinite(parsedCourseId),
  })

  const teacherCoursesQuery = useQuery({
    queryKey: ['teacher-portal', 'courses'],
    queryFn: getMyTeacherCourses,
    enabled: !isAdmin,
  })

  const course = useMemo(() => {
    if (isAdmin) {
      return adminCourseQuery.data ?? null
    }

    return (
      teacherCoursesQuery.data?.find((item) => item.courseId === parsedCourseId) ?? null
    )
  }, [adminCourseQuery.data, isAdmin, parsedCourseId, teacherCoursesQuery.data])

  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments', 'course', parsedCourseId],
    queryFn: () => getEnrollmentsByCourseId(parsedCourseId),
    enabled: isAdmin && Number.isFinite(parsedCourseId),
  })

  const teacherStudentsQuery = useQuery({
    queryKey: ['teacher-portal', 'students'],
    queryFn: getMyTeacherStudents,
    enabled: !isAdmin,
  })

  const adminSessionsQuery = useQuery({
    queryKey: ['class-sessions', 'course', parsedCourseId],
    queryFn: () => getClassSessionsByCourseId(parsedCourseId),
    enabled: isAdmin && Number.isFinite(parsedCourseId),
  })

  const teacherSessionsQuery = useQuery({
    queryKey: ['teacher-portal', 'class-sessions'],
    queryFn: getMyTeacherClassSessions,
    enabled: !isAdmin,
  })

  const paymentsQuery = useQuery({
    queryKey: ['payments', 'course', parsedCourseId],
    queryFn: () => getPaymentsByCourseId(parsedCourseId),
    enabled: isAdmin && Number.isFinite(parsedCourseId),
  })

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
    enabled: isAdmin,
  })

  const teachersQuery = useQuery({
    queryKey: ['teachers'],
    queryFn: getTeachers,
    enabled: isAdmin,
  })

  const filteredTeacherStudents = useMemo(
    () =>
      (teacherStudentsQuery.data ?? []).filter((student) => student.courseId === parsedCourseId),
    [parsedCourseId, teacherStudentsQuery.data],
  )

  const courseSessions = useMemo(() => {
    if (isAdmin) {
      return (adminSessionsQuery.data ?? []).filter(
        (session) => session.courseId === parsedCourseId,
      ) as Array<ClassSessionResponse | TeacherClassSessionResponse>
    }

    return (teacherSessionsQuery.data ?? []).filter(
      (session) => session.courseId === parsedCourseId,
    ) as Array<ClassSessionResponse | TeacherClassSessionResponse>
  }, [adminSessionsQuery.data, isAdmin, parsedCourseId, teacherSessionsQuery.data])

  const createSessionMutation = useMutation({
    mutationFn: createClassSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey })
      closeSessionModal()
    },
  })

  const updateSessionMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateClassSessionRequest }) =>
      updateClassSession(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey })
      closeSessionModal()
    },
  })

  const cancelSessionMutation = useMutation({
    mutationFn: cancelClassSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey })
    },
  })

  const completeSessionMutation = useMutation({
    mutationFn: completeClassSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey })
    },
  })

  const reactivateSessionMutation = useMutation({
    mutationFn: reactivateClassSession,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: sessionQueryKey })
    },
  })

  const createEnrollmentMutation = useMutation({
    mutationFn: createEnrollment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['enrollments', 'course', parsedCourseId] })
      closeEnrollmentModal()
    },
  })

  const updateEnrollmentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateEnrollmentRequest }) =>
      updateEnrollment(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['enrollments', 'course', parsedCourseId] })
      closeEnrollmentModal()
    },
  })

  const deactivateEnrollmentMutation = useMutation({
    mutationFn: deactivateEnrollment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['enrollments', 'course', parsedCourseId] })
    },
  })

  const reactivateEnrollmentMutation = useMutation({
    mutationFn: reactivateEnrollment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['enrollments', 'course', parsedCourseId] })
    },
  })

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCourseRequest }) =>
      updateCourse(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['courses', parsedCourseId] })
      await queryClient.invalidateQueries({ queryKey: ['courses'] })
      closeCourseModal()
    },
  })

  const deactivateCourseMutation = useMutation({
    mutationFn: deactivateCourse,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['courses', parsedCourseId] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
      ])
    },
  })

  const reactivateCourseMutation = useMutation({
    mutationFn: reactivateCourse,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['courses', parsedCourseId] }),
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
      ])
    },
  })

  const students = studentsQuery.data ?? []
  const enrollments = enrollmentsQuery.data ?? []
  const payments = paymentsQuery.data ?? []

  const courseListPath = isAdmin ? '/admin/courses' : '/teacher/courses'

  function openSessionCreateModal() {
    const defaultTeacherId = isAdmin
      ? String((course as CourseResponse).teacherId ?? '')
      : String((course as TeacherCourseResponse | null)?.teacherId ?? '')

    setSessionFormMode('create')
    setSelectedSession(null)
    setSessionFormValues({
      ...emptySessionFormValues,
      teacherId: defaultTeacherId,
    })
    setSessionFormErrorMessage('')
    setIsSessionModalOpen(true)
  }

  function openSessionEditModal(session: ClassSessionResponse | TeacherClassSessionResponse) {
    setSessionFormMode('edit')
    setSelectedSession(session)
    setSessionFormValues(toSessionFormValues(session))
    setSessionFormErrorMessage('')
    setIsSessionModalOpen(true)
  }

  function closeSessionModal() {
    setSelectedSession(null)
    setSessionFormValues(emptySessionFormValues)
    setSessionFormErrorMessage('')
    setIsSessionModalOpen(false)
  }

  function openEnrollmentCreateModal() {
    setEnrollmentFormMode('create')
    setSelectedEnrollment(null)
    setEnrollmentFormValues(emptyEnrollmentFormValues)
    setEnrollmentFormErrorMessage('')
    setIsEnrollmentModalOpen(true)
  }

  function openEnrollmentEditModal(enrollment: EnrollmentResponse) {
    setEnrollmentFormMode('edit')
    setSelectedEnrollment(enrollment)
    setEnrollmentFormValues(toEnrollmentFormValues(enrollment))
    setEnrollmentFormErrorMessage('')
    setIsEnrollmentModalOpen(true)
  }

  function closeEnrollmentModal() {
    setSelectedEnrollment(null)
    setEnrollmentFormValues(emptyEnrollmentFormValues)
    setEnrollmentFormErrorMessage('')
    setIsEnrollmentModalOpen(false)
  }

  function openCourseModal() {
    if (!course || !isAdmin) {
      return
    }

    setCourseFormValues(toCourseFormValues(course as CourseResponse))
    setCourseFormErrorMessage('')
    setIsCourseModalOpen(true)
  }

  function closeCourseModal() {
    setCourseFormValues(emptyCourseFormValues)
    setCourseFormErrorMessage('')
    setIsCourseModalOpen(false)
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

  function handleEnrollmentFormChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target
    setEnrollmentFormValues((currentValues) => ({
      ...currentValues,
      [name]: name === 'status' ? Number(value) : value,
    }))
  }

  function handleCourseFormChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target
    setCourseFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
  }

  async function handleSessionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSessionFormErrorMessage('')

    if (!course) {
      setSessionFormErrorMessage('Course details are still loading.')
      return
    }

    if (!Number.isFinite(parsedCourseId)) {
      setSessionFormErrorMessage('Invalid course route.')
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

    if (!sessionFormValues.startTime || !sessionFormValues.endTime) {
      setSessionFormErrorMessage('Start time and end time are required.')
      return
    }

    if (new Date(sessionFormValues.endTime) <= new Date(sessionFormValues.startTime)) {
      setSessionFormErrorMessage('End time must be after start time.')
      return
    }

    try {
      if (sessionFormMode === 'create') {
        await createSessionMutation.mutateAsync(
          buildSessionPayload(parsedCourseId, sessionFormValues) as CreateClassSessionRequest,
        )
        return
      }

      const existingSession = selectedSession
      if (!existingSession) {
        setSessionFormErrorMessage('Class session details are still loading.')
        return
      }

      const sessionId = 'id' in existingSession ? existingSession.id : existingSession.classSessionId
      const isActive = 'isActive' in existingSession ? existingSession.isActive : true

      await updateSessionMutation.mutateAsync({
        id: sessionId,
        payload: buildSessionPayload(parsedCourseId, sessionFormValues, isActive) as UpdateClassSessionRequest,
      })
    } catch (error) {
      setSessionFormErrorMessage(getErrorMessage(error, 'Unable to save class session details right now.'))
    }
  }

  async function handleEnrollmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setEnrollmentFormErrorMessage('')

    if (!enrollmentFormValues.studentId) {
      setEnrollmentFormErrorMessage('Student is required.')
      return
    }

    try {
      if (enrollmentFormMode === 'create') {
        await createEnrollmentMutation.mutateAsync(
          buildEnrollmentPayload(parsedCourseId, enrollmentFormValues) as CreateEnrollmentRequest,
        )
        return
      }

      if (!selectedEnrollment) {
        setEnrollmentFormErrorMessage('Enrollment details are still loading.')
        return
      }

      await updateEnrollmentMutation.mutateAsync({
        id: selectedEnrollment.id,
        payload: buildEnrollmentPayload(
          parsedCourseId,
          enrollmentFormValues,
          selectedEnrollment.isActive,
        ) as UpdateEnrollmentRequest,
      })
    } catch (error) {
      setEnrollmentFormErrorMessage(getErrorMessage(error, 'Unable to save enrollment details right now.'))
    }
  }

  async function handleCourseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCourseFormErrorMessage('')

    if (!course || !isAdmin) {
      setCourseFormErrorMessage('Course details are still loading.')
      return
    }

    try {
      await updateCourseMutation.mutateAsync({
        id: parsedCourseId,
        payload: buildCourseUpdatePayload(courseFormValues, course as CourseResponse),
      })
    } catch (error) {
      setCourseFormErrorMessage(getErrorMessage(error, 'Unable to save course details right now.'))
    }
  }

  async function handleCancelSession(session: ClassSessionResponse | TeacherClassSessionResponse) {
    const sessionId = 'id' in session ? session.id : session.classSessionId
    const shouldCancel = window.confirm(`Cancel "${session.title}"?`)

    if (!shouldCancel) {
      return
    }

    try {
      await cancelSessionMutation.mutateAsync(sessionId)
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to cancel the selected class session.'))
    }
  }

  async function handleCompleteSession(session: ClassSessionResponse | TeacherClassSessionResponse) {
    const sessionId = 'id' in session ? session.id : session.classSessionId
    const shouldComplete = window.confirm(`Mark "${session.title}" as completed?`)

    if (!shouldComplete) {
      return
    }

    try {
      await completeSessionMutation.mutateAsync(sessionId)
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to mark the selected class session as completed.'))
    }
  }

  async function handleReactivateSession(session: ClassSessionResponse | TeacherClassSessionResponse) {
    const sessionId = 'id' in session ? session.id : session.classSessionId
    const shouldReactivate = window.confirm(`Reactivate "${session.title}"?`)

    if (!shouldReactivate) {
      return
    }

    try {
      await reactivateSessionMutation.mutateAsync(sessionId)
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to reactivate the selected class session.'))
    }
  }

  async function handleDeactivateEnrollment(enrollment: EnrollmentResponse) {
    const shouldDeactivate = window.confirm(`Deactivate ${enrollment.studentName} from this course?`)

    if (!shouldDeactivate) {
      return
    }

    try {
      await deactivateEnrollmentMutation.mutateAsync(enrollment.id)
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to deactivate the selected enrollment.'))
    }
  }

  async function handleReactivateEnrollment(enrollment: EnrollmentResponse) {
    const shouldReactivate = window.confirm(`Reactivate ${enrollment.studentName} in this course?`)

    if (!shouldReactivate) {
      return
    }

    try {
      await reactivateEnrollmentMutation.mutateAsync(enrollment.id)
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to reactivate the selected enrollment.'))
    }
  }

  async function handleDeactivateCourse(courseValue: CourseResponse) {
    const shouldDeactivate = window.confirm(`Deactivate ${courseValue.name}?`)

    if (!shouldDeactivate) {
      return
    }

    try {
      await deactivateCourseMutation.mutateAsync(courseValue.id)
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to deactivate the selected course.'))
    }
  }

  async function handleReactivateCourse(courseValue: CourseResponse) {
    const shouldReactivate = window.confirm(`Reactivate ${courseValue.name}?`)

    if (!shouldReactivate) {
      return
    }

    try {
      await reactivateCourseMutation.mutateAsync(courseValue.id)
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to reactivate the selected course.'))
    }
  }

  if (!Number.isFinite(parsedCourseId)) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        Invalid course route.
      </div>
    )
  }

  const isLoading =
    (isAdmin && adminCourseQuery.isLoading) ||
    (!isAdmin && teacherCoursesQuery.isLoading) ||
    (isAdmin ? adminSessionsQuery.isLoading : teacherSessionsQuery.isLoading) ||
    (isAdmin && (enrollmentsQuery.isLoading || paymentsQuery.isLoading))

  const isError =
    (isAdmin && adminCourseQuery.isError) ||
    (!isAdmin && teacherCoursesQuery.isError) ||
    (isAdmin ? adminSessionsQuery.isError : teacherSessionsQuery.isError) ||
    (isAdmin && (enrollmentsQuery.isError || paymentsQuery.isError)) ||
    course === null

  if (isLoading) {
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

  if (isError || !course) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
          Unable to Load
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          Course workspace could not be loaded
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Check that the API is running and that you have access to this course.
        </p>
      </div>
    )
  }

  const courseName = isAdmin ? (course as CourseResponse).name : (course as TeacherCourseResponse).courseName
  const courseDescription = isAdmin ? (course as CourseResponse).description : (course as TeacherCourseResponse).description
  const courseCreatedAt = isAdmin ? (course as CourseResponse).createdAt : (course as TeacherCourseResponse).createdAt
  const courseIsActive = isAdmin ? (course as CourseResponse).isActive : (course as TeacherCourseResponse).isActive
  const courseTeacherName =
    isAdmin
      ? (course as CourseResponse).teacherName ?? 'No teacher assigned'
      : (course as TeacherCourseResponse).teacherName
  const fixedTeacherLabel = !isAdmin
    ? (course as TeacherCourseResponse).teacherName
    : undefined

  return (
    <>
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  className="text-sm font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
                  to={courseListPath}
                >
                  Back to Courses
                </Link>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                    courseIsActive
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      : 'bg-slate-100 text-slate-700 ring-slate-200'
                  }`}
                >
                  {courseIsActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                {courseName}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {courseDescription || 'No course description provided.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {isAdmin ? (
                <>
                  {canCreateSessions ? (
                    <button
                      className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                      onClick={openSessionCreateModal}
                      type="button"
                    >
                      Add Session
                    </button>
                  ) : null}
                  <button
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                    onClick={openCourseModal}
                    type="button"
                  >
                    Edit Course
                  </button>
                  <button
                    className="rounded-2xl border border-rose-200 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!courseIsActive || deactivateCourseMutation.isPending}
                    onClick={() => void handleDeactivateCourse(course as CourseResponse)}
                    type="button"
                  >
                    Deactivate
                  </button>
                  <button
                    className="rounded-2xl border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={courseIsActive || reactivateCourseMutation.isPending}
                    onClick={() => void handleReactivateCourse(course as CourseResponse)}
                    type="button"
                  >
                    Reactivate
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Teacher</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {courseTeacherName}
            </p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Monthly Fee</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {formatCurrency(isAdmin ? (course as CourseResponse).monthlyFee : (course as TeacherCourseResponse).monthlyFee)}
            </p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Students</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {isAdmin ? enrollments.length : filteredTeacherStudents.length}
            </p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Sessions</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {courseSessions.length}
            </p>
          </article>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap gap-3">
            {(['overview', 'students', 'sessions', ...(isAdmin ? ['payments'] : [])] as CourseTab[]).map((tab) => (
              <button
                key={tab}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === tab
                    ? 'bg-sky-500 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                {tab === 'overview'
                  ? 'Overview'
                  : tab === 'students'
                    ? 'Enrollments / Students'
                    : tab === 'sessions'
                      ? 'Sessions'
                      : 'Payments'}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'overview' ? (
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Course overview</h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <dt className="text-sm font-medium text-slate-500">Created</dt>
                  <dd className="mt-2 text-lg font-semibold text-slate-950">{formatDateTime(courseCreatedAt)}</dd>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <dt className="text-sm font-medium text-slate-500">Status</dt>
                  <dd className="mt-2 text-lg font-semibold text-slate-950">
                    {courseIsActive ? 'Active' : 'Inactive'}
                  </dd>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">Description</dt>
                  <dd className="mt-2 text-sm leading-6 text-slate-700">
                    {courseDescription || 'No course description provided yet.'}
                  </dd>
                </div>
              </dl>
            </article>

            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold tracking-tight text-slate-950">Next actions</h2>
              <div className="mt-5 flex flex-col gap-3">
                {isAdmin ? (
                  <button
                    className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                    onClick={openEnrollmentCreateModal}
                    type="button"
                  >
                    Add Enrollment
                  </button>
                ) : null}
                {canCreateSessions ? (
                  <button
                    className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                    onClick={openSessionCreateModal}
                    type="button"
                  >
                    Add Session
                  </button>
                ) : null}
                <button
                  className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                  onClick={() => setActiveTab('sessions')}
                  type="button"
                >
                  Manage Sessions
                </button>
              </div>
            </article>
          </div>
        ) : null}

        {activeTab === 'students' ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">Students in this course</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {isAdmin
                    ? 'Manage enrollments from inside the course workspace.'
                    : 'Review the students enrolled in your course.'}
                </p>
              </div>

              {isAdmin ? (
                <button
                  className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                  onClick={openEnrollmentCreateModal}
                  type="button"
                >
                  Add Enrollment
                </button>
              ) : null}
            </div>

            {isAdmin ? (
              enrollments.length === 0 ? (
                <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
                  <h3 className="text-lg font-semibold text-slate-950">No enrollments yet</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Add the first student to start attendance, sessions, and payment tracking for this course.
                  </p>
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        <th className="px-4 py-3">Student</th>
                        <th className="px-4 py-3">Enrolled</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Record State</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {enrollments.map((enrollment) => (
                        <tr key={enrollment.id} className="text-sm text-slate-700">
                          <td className="px-4 py-4 font-medium text-slate-950">{enrollment.studentName}</td>
                          <td className="px-4 py-4">{formatDateTime(enrollment.enrolledAt)}</td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getEnrollmentStatusBadgeClasses(enrollment.status)}`}>
                              {getEnrollmentStatusLabel(enrollment.status)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${enrollment.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
                              {enrollment.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                                onClick={() => openEnrollmentEditModal(enrollment)}
                                type="button"
                              >
                                Edit
                              </button>
                              <button
                                className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={!enrollment.isActive || deactivateEnrollmentMutation.isPending}
                                onClick={() => void handleDeactivateEnrollment(enrollment)}
                                type="button"
                              >
                                Deactivate
                              </button>
                              <button
                                className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={enrollment.isActive || reactivateEnrollmentMutation.isPending}
                                onClick={() => void handleReactivateEnrollment(enrollment)}
                                type="button"
                              >
                                Reactivate
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : filteredTeacherStudents.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
                <h3 className="text-lg font-semibold text-slate-950">No students yet</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Students enrolled in this course will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Phone</th>
                      <th className="px-4 py-3">Enrolled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTeacherStudents.map((student) => (
                      <tr key={`${student.courseId}-${student.studentId}`} className="text-sm text-slate-700">
                        <td className="px-4 py-4 font-medium text-slate-950">
                          {student.firstName} {student.lastName}
                        </td>
                        <td className="px-4 py-4">{student.email ?? 'Not provided'}</td>
                        <td className="px-4 py-4">{student.phoneNumber ?? 'Not provided'}</td>
                        <td className="px-4 py-4">{formatDateTime(student.enrolledAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'sessions' ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-slate-950">Class sessions</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage scheduling, completion flow, and document entry points inside this course.
                </p>
              </div>

              {canCreateSessions ? (
                <button
                  className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                  onClick={openSessionCreateModal}
                  type="button"
                >
                  Add Session
                </button>
              ) : null}
            </div>

            {courseSessions.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
                <h3 className="text-lg font-semibold text-slate-950">No sessions yet</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Create the first session for this course to manage meeting links and class documents.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {courseSessions.map((session) => {
                  const sessionId = 'id' in session ? session.id : session.classSessionId
                  const sessionTeacherName = 'teacherName' in session ? session.teacherName : fixedTeacherLabel ?? 'Assigned teacher'

                  return (
                    <article
                      key={sessionId}
                      className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-950">{session.title}</h3>
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getSessionStatusBadgeClasses(session.status)}`}>
                              {getSessionStatusLabel(session.status)}
                            </span>
                            {'isActive' in session ? (
                              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${session.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
                                {session.isActive ? 'Active' : 'Inactive'}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {session.description || 'No description provided.'}
                          </p>
                          <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                            <div>
                              <dt className="font-medium text-slate-500">Time</dt>
                              <dd className="mt-1">{formatDateTime(session.startTime)} to {formatDateTime(session.endTime)}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-slate-500">Mode</dt>
                              <dd className="mt-1">{getClassModeLabel(session.classMode)}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-slate-500">Teacher</dt>
                              <dd className="mt-1">{sessionTeacherName}</dd>
                            </div>
                            <div>
                              <dt className="font-medium text-slate-500">Meeting</dt>
                              <dd className="mt-1">{session.meetingProvider || 'No provider set'}</dd>
                            </div>
                          </dl>
                        </div>

                        <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
                            onClick={() => navigate(`${courseListPath}/${parsedCourseId}/sessions/${sessionId}`)}
                            type="button"
                          >
                            View Details
                          </button>
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
                            onClick={() => navigate(`${courseListPath}/${parsedCourseId}/sessions/${sessionId}?action=upload`)}
                            type="button"
                          >
                            Upload Document
                          </button>
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
                            onClick={() => navigate(`${courseListPath}/${parsedCourseId}/sessions/${sessionId}?section=documents`)}
                            type="button"
                          >
                            View Documents
                          </button>
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white hover:text-slate-950"
                            onClick={() => openSessionEditModal(session)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={session.status === 3 || cancelSessionMutation.isPending}
                            onClick={() => void handleCancelSession(session)}
                            type="button"
                          >
                            Cancel
                          </button>
                          <button
                            className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={
                              session.status === 2 ||
                              session.status === 3 ||
                              completeSessionMutation.isPending
                            }
                            onClick={() => void handleCompleteSession(session)}
                            type="button"
                          >
                            Complete
                          </button>
                          <button
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={session.status !== 3 || reactivateSessionMutation.isPending}
                            onClick={() => void handleReactivateSession(session)}
                            type="button"
                          >
                            Reactivate
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        ) : null}

        {activeTab === 'payments' && isAdmin ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold tracking-tight text-slate-950">Payments for this course</h2>
            <p className="mt-1 text-sm text-slate-500">
              Course-level fee tracking stays available here so admins do not need to jump to a separate page for basic review.
            </p>

            {payments.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
                <h3 className="text-lg font-semibold text-slate-950">No payments found</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Payments recorded for this course will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">Period</th>
                      <th className="px-4 py-3">Amounts</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payments.map((payment: PaymentResponse) => (
                      <tr key={payment.id} className="text-sm text-slate-700">
                        <td className="px-4 py-4 font-medium text-slate-950">{payment.studentName}</td>
                        <td className="px-4 py-4">
                          {new Intl.DateTimeFormat('en-LK', { month: 'long', year: 'numeric' }).format(new Date(payment.paymentYear, payment.paymentMonth - 1, 1))}
                        </td>
                        <td className="px-4 py-4">
                          <p>Total {formatCurrency(payment.amount)}</p>
                          <p className="mt-1 text-slate-500">Balance {formatCurrency(payment.balanceAmount)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getPaymentStatusBadgeClasses(payment.paymentStatus)}`}>
                            {getPaymentStatusLabel(payment.paymentStatus)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </section>

      {isSessionModalOpen ? (
        <SessionFormModal
          courseName={courseName}
          errorMessage={sessionFormErrorMessage}
          fixedTeacherLabel={!isAdmin ? fixedTeacherLabel : undefined}
          formValues={sessionFormValues}
          isSubmitting={createSessionMutation.isPending || updateSessionMutation.isPending}
          mode={sessionFormMode}
          onChange={handleSessionFormChange}
          onClose={closeSessionModal}
          onSubmit={handleSessionSubmit}
          teachers={teachersQuery.data ?? []}
        />
      ) : null}

      {isEnrollmentModalOpen && isAdmin ? (
        <EnrollmentFormModal
          courseName={courseName}
          errorMessage={enrollmentFormErrorMessage}
          formValues={enrollmentFormValues}
          isSubmitting={createEnrollmentMutation.isPending || updateEnrollmentMutation.isPending}
          mode={enrollmentFormMode}
          onChange={handleEnrollmentFormChange}
          onClose={closeEnrollmentModal}
          onSubmit={handleEnrollmentSubmit}
          students={students}
        />
      ) : null}

      {isCourseModalOpen && isAdmin ? (
        <CourseFormModal
          errorMessage={courseFormErrorMessage}
          formValues={courseFormValues}
          isSubmitting={updateCourseMutation.isPending}
          onChange={handleCourseFormChange}
          onClose={closeCourseModal}
          onSubmit={handleCourseSubmit}
          teachers={teachersQuery.data ?? []}
        />
      ) : null}
    </>
  )
}

export function AdminCourseDetailsPage() {
  return <CourseDetailsWorkspace portal="admin" />
}

export function TeacherCourseDetailsPage() {
  return <CourseDetailsWorkspace portal="teacher" />
}
