import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createCourse,
  deleteCourseForever,
  deactivateCourse,
  getCourseById,
  getCourses,
  reactivateCourse,
  updateCourse,
} from '../features/courses/api'
import type {
  CourseResponse,
  CreateCourseRequest,
  UpdateCourseRequest,
} from '../features/courses/types'
import { getTeachers } from '../features/teachers/api'
import type { TeacherResponse } from '../features/teachers/types'

type CourseFormMode = 'create' | 'edit'

type CourseFormValues = {
  name: string
  description: string
  teacherId: string
  monthlyFee: string
}

const emptyFormValues: CourseFormValues = {
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

function toCourseFormValues(course: CourseResponse): CourseFormValues {
  return {
    name: course.name,
    description: course.description ?? '',
    teacherId: course.teacherId ? String(course.teacherId) : '',
    monthlyFee: Number.isFinite(course.monthlyFee) ? String(course.monthlyFee) : '',
  }
}

function buildCreatePayload(values: CourseFormValues): CreateCourseRequest {
  return {
    name: values.name.trim(),
    description: toOptionalString(values.description),
    teacherId: toOptionalNumber(values.teacherId),
    monthlyFee: Number(values.monthlyFee),
  }
}

function buildUpdatePayload(
  values: CourseFormValues,
  existingCourse: CourseResponse,
): UpdateCourseRequest {
  return {
    ...buildCreatePayload(values),
    isActive: existingCourse.isActive,
  }
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
    maximumFractionDigits: 0,
  }).format(value)
}

function getTeacherLabel(teacher: TeacherResponse) {
  return `${teacher.firstName} ${teacher.lastName}`.trim()
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

function CourseFormModal({
  errorMessage,
  formValues,
  isLoadingCourse,
  isLoadingTeachers,
  isSubmitting,
  mode,
  onChange,
  onClose,
  onSubmit,
  teachers,
}: {
  errorMessage: string
  formValues: CourseFormValues
  isLoadingCourse: boolean
  isLoadingTeachers: boolean
  isSubmitting: boolean
  mode: CourseFormMode
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
                {mode === 'create' ? 'Add Course' : 'Edit Course'}
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {mode === 'create'
                  ? 'Create a new course record'
                  : 'Update course details'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Keep course records clear so teacher assignment and later Phase 1
                scheduling workflows stay organized.
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

        {isLoadingCourse ? (
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
                <p className="text-sm font-semibold text-slate-950">Course Details</p>
                <p className="mt-1 text-sm text-slate-500">
                  Use the core Phase 1 course fields supported by the backend.
                </p>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Course Name
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  name="name"
                  onChange={onChange}
                  required
                  value={formValues.name}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Description
                </span>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  name="description"
                  onChange={onChange}
                  value={formValues.description}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Assigned Teacher
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    name="teacherId"
                    onChange={onChange}
                    value={formValues.teacherId}
                  >
                    <option value="">
                      {isLoadingTeachers ? 'Loading teachers...' : 'Select a teacher'}
                    </option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {getTeacherLabel(teacher)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Monthly Fee
                  </span>
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
                disabled={isSubmitting || isLoadingTeachers}
                type="submit"
              >
                {isSubmitting
                  ? mode === 'create'
                    ? 'Creating...'
                    : 'Saving...'
                  : mode === 'create'
                    ? 'Create Course'
                    : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export function CoursesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchValue, setSearchValue] = useState('')
  const [recordFilter, setRecordFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  )
  const [formMode, setFormMode] = useState<CourseFormMode>('create')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [formValues, setFormValues] = useState<CourseFormValues>(emptyFormValues)
  const [formErrorMessage, setFormErrorMessage] = useState('')

  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  })

  const teachersQuery = useQuery({
    queryKey: ['teachers'],
    queryFn: getTeachers,
  })

  const selectedCourseQuery = useQuery({
    queryKey: ['courses', selectedCourseId],
    queryFn: () => getCourseById(selectedCourseId as number),
    enabled: isModalOpen && formMode === 'edit' && selectedCourseId !== null,
  })

  useEffect(() => {
    if (selectedCourseQuery.data) {
      setFormValues(toCourseFormValues(selectedCourseQuery.data))
    }
  }, [selectedCourseQuery.data])

  const createCourseMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['courses'] })
      closeModal()
    },
  })

  const updateCourseMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCourseRequest }) =>
      updateCourse(id, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
        queryClient.invalidateQueries({ queryKey: ['courses', variables.id] }),
      ])
      closeModal()
    },
  })

  const deactivateCourseMutation = useMutation({
    mutationFn: deactivateCourse,
    onSuccess: async (_, courseId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
        queryClient.invalidateQueries({ queryKey: ['courses', courseId] }),
      ])
    },
  })

  const reactivateCourseMutation = useMutation({
    mutationFn: reactivateCourse,
    onSuccess: async (_, courseId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['courses'] }),
        queryClient.invalidateQueries({ queryKey: ['courses', courseId] }),
      ])
    },
  })

  const deleteCourseForeverMutation = useMutation({
    mutationFn: deleteCourseForever,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['courses'] })
    },
  })

  const filteredCourses = useMemo(() => {
    const courses = coursesQuery.data ?? []
    const normalizedSearch = searchValue.trim().toLowerCase()

    if (!normalizedSearch) {
      return courses.filter((course) =>
        recordFilter === 'all'
          ? true
          : recordFilter === 'active'
            ? course.isActive
            : !course.isActive,
      )
    }

    return courses.filter((course) => {
      if (recordFilter === 'active' && !course.isActive) {
        return false
      }

      if (recordFilter === 'inactive' && course.isActive) {
        return false
      }

      const searchableFields = [
        course.name,
        course.description ?? '',
        course.teacherName ?? '',
      ]

      return searchableFields.some((field) =>
        field.toLowerCase().includes(normalizedSearch),
      )
    })
  }, [coursesQuery.data, recordFilter, searchValue])

  function openCreateModal() {
    setFormMode('create')
    setSelectedCourseId(null)
    setFormValues(emptyFormValues)
    setFormErrorMessage('')
    setIsModalOpen(true)
  }

  function openEditModal(courseId: number) {
    setFormMode('edit')
    setSelectedCourseId(courseId)
    setFormValues(emptyFormValues)
    setFormErrorMessage('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setSelectedCourseId(null)
    setFormValues(emptyFormValues)
    setFormErrorMessage('')
  }

  function handleFormChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormErrorMessage('')

    try {
      if (formMode === 'create') {
        await createCourseMutation.mutateAsync(buildCreatePayload(formValues))
        return
      }

      const existingCourse = selectedCourseQuery.data
      if (!existingCourse || selectedCourseId === null) {
        setFormErrorMessage('Course details are still loading. Please try again.')
        return
      }

      await updateCourseMutation.mutateAsync({
        id: selectedCourseId,
        payload: buildUpdatePayload(formValues, existingCourse),
      })
    } catch (error) {
      setFormErrorMessage(
        getErrorMessage(error, 'Unable to save course details right now.'),
      )
    }
  }

  async function handleDeactivate(course: CourseResponse) {
    const shouldDeactivate = window.confirm(`Deactivate ${course.name}?`)

    if (!shouldDeactivate) {
      return
    }

    try {
      await deactivateCourseMutation.mutateAsync(course.id)
    } catch (error) {
      window.alert(
        getErrorMessage(error, 'Unable to deactivate the selected course.'),
      )
    }
  }

  async function handleReactivate(course: CourseResponse) {
    const shouldReactivate = window.confirm(`Reactivate ${course.name}?`)

    if (!shouldReactivate) {
      return
    }

    try {
      await reactivateCourseMutation.mutateAsync(course.id)
    } catch (error) {
      window.alert(
        getErrorMessage(error, 'Unable to reactivate the selected course.'),
      )
    }
  }

  async function handleDeleteForever(course: CourseResponse) {
    const shouldDelete = window.confirm(
      `Delete ${course.name} forever? This cannot be undone.`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      await deleteCourseForeverMutation.mutateAsync(course.id)
    } catch (error) {
      window.alert(
        getErrorMessage(error, 'Unable to permanently delete the selected course.'),
      )
    }
  }

  const isSubmitting =
    createCourseMutation.isPending || updateCourseMutation.isPending

  return (
    <>
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                Course Management
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                Manage courses, teacher assignments, and monthly fees
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Review course records, assign teachers, and keep the active catalog
                organized from one clean admin table.
              </p>
            </div>

            <button
              className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
              onClick={openCreateModal}
              type="button"
            >
              Add Course
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">Course Directory</p>
              <p className="mt-1 text-sm text-slate-500">
                Filter by course name, description, teacher, and record state.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 md:max-w-2xl md:flex-row">
              <label className="block md:w-44">
                <span className="sr-only">Filter courses by state</span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  onChange={(event) =>
                    setRecordFilter(
                      event.target.value as 'all' | 'active' | 'inactive',
                    )
                  }
                  value={recordFilter}
                >
                  <option value="all">All records</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>

              <label className="block flex-1">
                <span className="sr-only">Search courses</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search courses"
                  value={searchValue}
                />
              </label>
            </div>
          </div>
        </div>

        {coursesQuery.isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
              />
            ))}
          </div>
        ) : coursesQuery.isError ? (
          <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
            <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
              Unable to Load
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Course data could not be fetched
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Check that the API is running and try loading the course list again.
            </p>
            <button
              className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => void coursesQuery.refetch()}
              type="button"
            >
              Retry Course Load
            </button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Empty State
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              {searchValue ? 'No courses matched your search' : 'No courses found'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {searchValue
                ? 'Try a different course name, teacher, or keyword.'
                : 'Create the first course record to start assigning teachers and tracking fees.'}
            </p>
            {!searchValue ? (
              <button
                className="mt-6 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                onClick={openCreateModal}
                type="button"
              >
                Add First Course
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-6 py-4">Course</th>
                    <th className="px-6 py-4">Teacher</th>
                    <th className="px-6 py-4">Monthly Fee</th>
                    <th className="px-6 py-4">Students</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCourses.map((course) => (
                    <tr key={course.id} className="align-top text-sm text-slate-700">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-950">{course.name}</p>
                        <p className="mt-1 max-w-xs text-slate-500">
                          {course.description || 'No description provided'}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        {course.teacherName || 'No teacher assigned'}
                      </td>
                      <td className="px-6 py-5 font-medium">
                        {formatCurrency(course.monthlyFee)}
                      </td>
                      <td className="px-6 py-5">
                        {new Intl.NumberFormat('en-LK').format(course.studentCount)}
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            course.isActive
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                              : 'bg-slate-100 text-slate-700 ring-slate-200'
                          }`}
                        >
                          {course.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5">{formatDateTime(course.createdAt)}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-xl border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                            onClick={() => navigate(`/admin/courses/${course.id}`)}
                            type="button"
                          >
                            Open Workspace
                          </button>
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                            onClick={() => openEditModal(course.id)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={
                              !course.isActive || deactivateCourseMutation.isPending
                            }
                            onClick={() => void handleDeactivate(course)}
                            type="button"
                          >
                            {course.isActive ? 'Deactivate' : 'Inactive'}
                          </button>
                          <button
                            className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={
                              course.isActive || reactivateCourseMutation.isPending
                            }
                            onClick={() => void handleReactivate(course)}
                            type="button"
                          >
                            Reactivate
                          </button>
                          <button
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={deleteCourseForeverMutation.isPending}
                            onClick={() => void handleDeleteForever(course)}
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
        <CourseFormModal
          errorMessage={formErrorMessage}
          formValues={formValues}
          isLoadingCourse={selectedCourseQuery.isLoading}
          isLoadingTeachers={teachersQuery.isLoading}
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
