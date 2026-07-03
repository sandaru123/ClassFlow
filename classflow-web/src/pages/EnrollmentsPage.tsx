import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { getCourses } from '../features/courses/api'
import type { CourseResponse } from '../features/courses/types'
import {
  createEnrollment,
  deactivateEnrollment,
  getEnrollmentById,
  getEnrollments,
  updateEnrollment,
} from '../features/enrollments/api'
import type {
  CreateEnrollmentRequest,
  EnrollmentResponse,
  EnrollmentStatus,
  UpdateEnrollmentRequest,
} from '../features/enrollments/types'
import { getStudents } from '../features/students/api'
import type { StudentResponse } from '../features/students/types'

type EnrollmentFormMode = 'create' | 'edit'

type EnrollmentFormValues = {
  studentId: string
  courseId: string
  enrolledAt: string
  status: EnrollmentStatus
}

const enrollmentStatusOptions: Array<{
  value: EnrollmentStatus
  label: string
}> = [
  { value: 0, label: 'Active' },
  { value: 1, label: 'Completed' },
  { value: 2, label: 'Dropped' },
  { value: 3, label: 'Cancelled' },
]

const emptyFormValues: EnrollmentFormValues = {
  studentId: '',
  courseId: '',
  enrolledAt: '',
  status: 0,
}

function toEnrollmentFormValues(
  enrollment: EnrollmentResponse,
): EnrollmentFormValues {
  return {
    studentId: String(enrollment.studentId),
    courseId: String(enrollment.courseId),
    enrolledAt: enrollment.enrolledAt.slice(0, 16),
    status: enrollment.status,
  }
}

function buildCreatePayload(
  values: EnrollmentFormValues,
): CreateEnrollmentRequest {
  return {
    studentId: Number(values.studentId),
    courseId: Number(values.courseId),
    enrolledAt: values.enrolledAt ? new Date(values.enrolledAt).toISOString() : null,
    status: values.status,
  }
}

function buildUpdatePayload(
  values: EnrollmentFormValues,
  existingEnrollment: EnrollmentResponse,
): UpdateEnrollmentRequest {
  return {
    studentId: Number(values.studentId),
    courseId: Number(values.courseId),
    enrolledAt: new Date(values.enrolledAt).toISOString(),
    status: values.status,
    isActive: existingEnrollment.isActive,
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getStatusLabel(status: EnrollmentStatus) {
  return (
    enrollmentStatusOptions.find((option) => option.value === status)?.label ??
    'Unknown'
  )
}

function getStatusBadgeClasses(status: EnrollmentStatus) {
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

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallbackMessage
  }

  return fallbackMessage
}

function EnrollmentFormModal({
  courses,
  errorMessage,
  formValues,
  isLoadingDependencies,
  isLoadingEnrollment,
  isSubmitting,
  mode,
  onChange,
  onClose,
  onSubmit,
  students,
}: {
  courses: CourseResponse[]
  errorMessage: string
  formValues: EnrollmentFormValues
  isLoadingDependencies: boolean
  isLoadingEnrollment: boolean
  isSubmitting: boolean
  mode: EnrollmentFormMode
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  students: StudentResponse[]
}) {
  const hasStudents = students.length > 0
  const hasCourses = courses.length > 0
  const canSubmit = hasStudents && hasCourses && !isSubmitting

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
                {mode === 'create'
                  ? 'Assign a student to a course'
                  : 'Update enrollment details'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Keep student-to-course assignments clean so attendance, payments,
                and later Phase 1 workflows can rely on accurate enrollment data.
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

        {isLoadingEnrollment || isLoadingDependencies ? (
          <div className="space-y-4 px-6 py-8 sm:px-8">
            {Array.from({ length: 4 }, (_, index) => (
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
                <p className="text-sm font-semibold text-slate-950">
                  Enrollment Details
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Select a student, select a course, and keep the enrollment
                  status clear and easy to scan.
                </p>
              </div>

              {!hasStudents ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No students exist yet. Create a student before adding an
                  enrollment.
                </div>
              ) : null}

              {!hasCourses ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No courses exist yet. Create a course before adding an
                  enrollment.
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Student
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    disabled={!hasStudents}
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
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Enrolled At
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    name="enrolledAt"
                    onChange={onChange}
                    required={mode === 'edit'}
                    type="datetime-local"
                    value={formValues.enrolledAt}
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
                    {enrollmentStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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
                    ? 'Create Enrollment'
                    : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export function EnrollmentsPage() {
  const queryClient = useQueryClient()
  const [searchValue, setSearchValue] = useState('')
  const [formMode, setFormMode] = useState<EnrollmentFormMode>('create')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<number | null>(
    null,
  )
  const [formValues, setFormValues] = useState<EnrollmentFormValues>(emptyFormValues)
  const [formErrorMessage, setFormErrorMessage] = useState('')

  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments'],
    queryFn: getEnrollments,
  })

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
  })

  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  })

  const selectedEnrollmentQuery = useQuery({
    queryKey: ['enrollments', selectedEnrollmentId],
    queryFn: () => getEnrollmentById(selectedEnrollmentId as number),
    enabled: isModalOpen && formMode === 'edit' && selectedEnrollmentId !== null,
  })

  useEffect(() => {
    if (selectedEnrollmentQuery.data) {
      setFormValues(toEnrollmentFormValues(selectedEnrollmentQuery.data))
    }
  }, [selectedEnrollmentQuery.data])

  const createEnrollmentMutation = useMutation({
    mutationFn: createEnrollment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['enrollments'] })
      closeModal()
    },
  })

  const updateEnrollmentMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: UpdateEnrollmentRequest
    }) => updateEnrollment(id, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['enrollments'] }),
        queryClient.invalidateQueries({ queryKey: ['enrollments', variables.id] }),
      ])
      closeModal()
    },
  })

  const deactivateEnrollmentMutation = useMutation({
    mutationFn: deactivateEnrollment,
    onSuccess: async (_, enrollmentId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['enrollments'] }),
        queryClient.invalidateQueries({ queryKey: ['enrollments', enrollmentId] }),
      ])
    },
  })

  const filteredEnrollments = useMemo(() => {
    const enrollments = enrollmentsQuery.data ?? []
    const normalizedSearch = searchValue.trim().toLowerCase()

    if (!normalizedSearch) {
      return enrollments
    }

    return enrollments.filter((enrollment) =>
      [enrollment.studentName, enrollment.courseName, getStatusLabel(enrollment.status)]
        .some((field) => field.toLowerCase().includes(normalizedSearch)),
    )
  }, [enrollmentsQuery.data, searchValue])

  function openCreateModal() {
    setFormMode('create')
    setSelectedEnrollmentId(null)
    setFormValues(emptyFormValues)
    setFormErrorMessage('')
    setIsModalOpen(true)
  }

  function openEditModal(enrollmentId: number) {
    setFormMode('edit')
    setSelectedEnrollmentId(enrollmentId)
    setFormValues(emptyFormValues)
    setFormErrorMessage('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setSelectedEnrollmentId(null)
    setFormValues(emptyFormValues)
    setFormErrorMessage('')
  }

  function handleFormChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: name === 'status' ? Number(value) : value,
    }))
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormErrorMessage('')

    if (!formValues.studentId || !formValues.courseId) {
      setFormErrorMessage('Select both a student and a course.')
      return
    }

    try {
      if (formMode === 'create') {
        await createEnrollmentMutation.mutateAsync(buildCreatePayload(formValues))
        return
      }

      const existingEnrollment = selectedEnrollmentQuery.data
      if (!existingEnrollment || selectedEnrollmentId === null) {
        setFormErrorMessage(
          'Enrollment details are still loading. Please try again.',
        )
        return
      }

      if (!formValues.enrolledAt) {
        setFormErrorMessage('Enrollment date and time are required when editing.')
        return
      }

      await updateEnrollmentMutation.mutateAsync({
        id: selectedEnrollmentId,
        payload: buildUpdatePayload(formValues, existingEnrollment),
      })
    } catch (error) {
      setFormErrorMessage(
        getErrorMessage(error, 'Unable to save enrollment details right now.'),
      )
    }
  }

  async function handleDeactivate(enrollment: EnrollmentResponse) {
    const shouldDeactivate = window.confirm(
      `Deactivate the enrollment for ${enrollment.studentName} in ${enrollment.courseName}?`,
    )

    if (!shouldDeactivate) {
      return
    }

    try {
      await deactivateEnrollmentMutation.mutateAsync(enrollment.id)
    } catch (error) {
      window.alert(
        getErrorMessage(error, 'Unable to deactivate the selected enrollment.'),
      )
    }
  }

  const isSubmitting =
    createEnrollmentMutation.isPending || updateEnrollmentMutation.isPending

  return (
    <>
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                Enrollment Management
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                Keep student-to-course assignments clear and easy to manage
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Review enrollments, update assignment details, and deactivate
                outdated course links from one clean admin table.
              </p>
            </div>

            <button
              className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
              onClick={openCreateModal}
              type="button"
            >
              Add Enrollment
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Enrollment Directory
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Filter by student name, course name, or status.
              </p>
            </div>

            <label className="block w-full md:max-w-sm">
              <span className="sr-only">Search enrollments</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search enrollments"
                value={searchValue}
              />
            </label>
          </div>
        </div>

        {enrollmentsQuery.isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
              />
            ))}
          </div>
        ) : enrollmentsQuery.isError ? (
          <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
            <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
              Unable to Load
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Enrollment data could not be fetched
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Check that the API is running and try loading the enrollment list
              again.
            </p>
            <button
              className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => void enrollmentsQuery.refetch()}
              type="button"
            >
              Retry Enrollment Load
            </button>
          </div>
        ) : filteredEnrollments.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Empty State
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              {searchValue
                ? 'No enrollments matched your search'
                : 'No enrollments found'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {searchValue
                ? 'Try a different student name, course name, or status.'
                : 'Create the first enrollment to start assigning students to courses.'}
            </p>
            {!searchValue ? (
              <button
                className="mt-6 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                onClick={openCreateModal}
                type="button"
              >
                Add First Enrollment
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Course</th>
                    <th className="px-6 py-4">Enrolled</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Record</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEnrollments.map((enrollment) => (
                    <tr
                      key={enrollment.id}
                      className="align-top text-sm text-slate-700"
                    >
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-950">
                          {enrollment.studentName}
                        </p>
                        <p className="mt-1 text-slate-500">
                          Student ID: {enrollment.studentId}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-medium text-slate-950">
                          {enrollment.courseName}
                        </p>
                        <p className="mt-1 text-slate-500">
                          Course ID: {enrollment.courseId}
                        </p>
                      </td>
                      <td className="px-6 py-5">{formatDateTime(enrollment.enrolledAt)}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClasses(
                              enrollment.status,
                            )}`}
                          >
                            {getStatusLabel(enrollment.status)}
                          </span>
                          <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                              enrollment.isActive
                                ? 'bg-sky-50 text-sky-700 ring-sky-200'
                                : 'bg-slate-100 text-slate-700 ring-slate-200'
                            }`}
                          >
                            {enrollment.isActive ? 'Active record' : 'Inactive record'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p>{formatDateTime(enrollment.createdAt)}</p>
                        <p className="mt-1 text-slate-500">
                          {enrollment.updatedAt
                            ? `Updated ${formatDateTime(enrollment.updatedAt)}`
                            : 'No updates yet'}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                            onClick={() => openEditModal(enrollment.id)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={
                              !enrollment.isActive ||
                              deactivateEnrollmentMutation.isPending
                            }
                            onClick={() => void handleDeactivate(enrollment)}
                            type="button"
                          >
                            {enrollment.isActive ? 'Deactivate' : 'Inactive'}
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
        <EnrollmentFormModal
          courses={coursesQuery.data ?? []}
          errorMessage={formErrorMessage}
          formValues={formValues}
          isLoadingDependencies={studentsQuery.isLoading || coursesQuery.isLoading}
          isLoadingEnrollment={selectedEnrollmentQuery.isLoading}
          isSubmitting={isSubmitting}
          mode={formMode}
          onChange={handleFormChange}
          onClose={closeModal}
          onSubmit={handleFormSubmit}
          students={studentsQuery.data ?? []}
        />
      ) : null}
    </>
  )
}
