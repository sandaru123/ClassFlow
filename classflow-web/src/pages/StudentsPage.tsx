import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  createStudent,
  deactivateStudent,
  getStudentById,
  getStudents,
  updateStudent,
} from '../features/students/api'
import type {
  CreateStudentRequest,
  StudentResponse,
  UpdateStudentRequest,
} from '../features/students/types'

type StudentFormMode = 'create' | 'edit'

type StudentFormValues = {
  firstName: string
  lastName: string
  email: string
  temporaryPassword: string
  createLoginAccount: boolean
  phoneNumber: string
  address: string
  dateOfBirth: string
}

const emptyFormValues: StudentFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  temporaryPassword: '',
  createLoginAccount: true,
  phoneNumber: '',
  address: '',
  dateOfBirth: '',
}

function toOptionalString(value: string): string | null {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

function toStudentFormValues(student: StudentResponse): StudentFormValues {
  return {
    firstName: student.firstName,
    lastName: student.lastName,
    email: student.email ?? '',
    temporaryPassword: '',
    createLoginAccount: student.hasLoginAccount,
    phoneNumber: student.phoneNumber ?? '',
    address: student.address ?? '',
    dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
  }
}

function buildCreatePayload(values: StudentFormValues): CreateStudentRequest {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: toOptionalString(values.email),
    temporaryPassword: values.createLoginAccount
      ? toOptionalString(values.temporaryPassword)
      : null,
    createLoginAccount: values.createLoginAccount,
    phoneNumber: toOptionalString(values.phoneNumber),
    address: toOptionalString(values.address),
    dateOfBirth: values.dateOfBirth || null,
  }
}

function buildUpdatePayload(
  values: StudentFormValues,
  existingStudent: StudentResponse,
): UpdateStudentRequest {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: toOptionalString(values.email),
    phoneNumber: toOptionalString(values.phoneNumber),
    address: toOptionalString(values.address),
    dateOfBirth: values.dateOfBirth || null,
    isActive: existingStudent.isActive,
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Not provided'
  }

  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallbackMessage
  }

  return fallbackMessage
}

function StudentFormModal({
  errorMessage,
  formValues,
  isLoadingStudent,
  isSubmitting,
  mode,
  onChange,
  onClose,
  onSubmit,
}: {
  errorMessage: string
  formValues: StudentFormValues
  isLoadingStudent: boolean
  isSubmitting: boolean
  mode: StudentFormMode
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                {mode === 'create' ? 'Add Student' : 'Edit Student'}
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {mode === 'create'
                  ? 'Create a new student record'
                  : 'Update student details'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Keep student records clean and current so attendance, payments,
                and enrollments can stay organized in later Phase 1 modules.
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

        {isLoadingStudent ? (
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
                <p className="text-sm font-semibold text-slate-950">Basic Details</p>
                <p className="mt-1 text-sm text-slate-500">
                  Use the exact student fields supported by the backend.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    First Name
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    name="firstName"
                    onChange={onChange}
                    required
                    value={formValues.firstName}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Last Name
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    name="lastName"
                    onChange={onChange}
                    required
                    value={formValues.lastName}
                  />
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">Contact Details</p>
                <p className="mt-1 text-sm text-slate-500">
                  Email is required for linked login accounts. Phone number and
                  address remain optional.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Email
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    name="email"
                    onChange={onChange}
                    type="email"
                    value={formValues.email}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Phone Number
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    name="phoneNumber"
                    onChange={onChange}
                    value={formValues.phoneNumber}
                  />
                </label>
              </div>

              {mode === 'create' ? (
                <section className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <label className="flex items-start gap-3">
                    <input
                      checked={formValues.createLoginAccount}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400"
                      name="createLoginAccount"
                      onChange={onChange}
                      type="checkbox"
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">
                        Create linked login account
                      </span>
                      <span className="mt-1 block text-sm text-slate-500">
                        Creates an ASP.NET Identity user for this student and assigns
                        the Student role.
                      </span>
                    </span>
                  </label>

                  {formValues.createLoginAccount ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-700">
                          Temporary Password
                        </span>
                        <input
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400"
                          name="temporaryPassword"
                          onChange={onChange}
                          required={formValues.createLoginAccount}
                          type="password"
                          value={formValues.temporaryPassword}
                        />
                      </label>
                    </div>
                  ) : null}
                </section>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Address
                </span>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  name="address"
                  onChange={onChange}
                  value={formValues.address}
                />
              </label>

              <label className="block sm:max-w-xs">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Date of Birth
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  name="dateOfBirth"
                  onChange={onChange}
                  type="date"
                  value={formValues.dateOfBirth}
                />
              </label>
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
                    ? 'Create Student'
                    : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export function StudentsPage() {
  const queryClient = useQueryClient()
  const [searchValue, setSearchValue] = useState('')
  const [formMode, setFormMode] = useState<StudentFormMode>('create')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)
  const [formValues, setFormValues] = useState<StudentFormValues>(emptyFormValues)
  const [formErrorMessage, setFormErrorMessage] = useState('')

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
  })

  const selectedStudentQuery = useQuery({
    queryKey: ['students', selectedStudentId],
    queryFn: () => getStudentById(selectedStudentId as number),
    enabled: isModalOpen && formMode === 'edit' && selectedStudentId !== null,
  })

  useEffect(() => {
    if (selectedStudentQuery.data) {
      setFormValues(toStudentFormValues(selectedStudentQuery.data))
    }
  }, [selectedStudentQuery.data])

  const createStudentMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['students'] })
      closeModal()
    },
  })

  const updateStudentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateStudentRequest }) =>
      updateStudent(id, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['students'] }),
        queryClient.invalidateQueries({ queryKey: ['students', variables.id] }),
      ])
      closeModal()
    },
  })

  const deactivateStudentMutation = useMutation({
    mutationFn: deactivateStudent,
    onSuccess: async (_, studentId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['students'] }),
        queryClient.invalidateQueries({ queryKey: ['students', studentId] }),
      ])
    },
  })

  const filteredStudents = useMemo(() => {
    const students = studentsQuery.data ?? []
    const normalizedSearch = searchValue.trim().toLowerCase()

    if (!normalizedSearch) {
      return students
    }

    return students.filter((student) => {
      const searchableFields = [
        `${student.firstName} ${student.lastName}`,
        student.email ?? '',
        student.phoneNumber ?? '',
      ]

      return searchableFields.some((field) =>
        field.toLowerCase().includes(normalizedSearch),
      )
    })
  }, [searchValue, studentsQuery.data])

  function openCreateModal() {
    setFormMode('create')
    setSelectedStudentId(null)
    setFormValues(emptyFormValues)
    setFormErrorMessage('')
    setIsModalOpen(true)
  }

  function openEditModal(studentId: number) {
    setFormMode('edit')
    setSelectedStudentId(studentId)
    setFormValues(emptyFormValues)
    setFormErrorMessage('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setSelectedStudentId(null)
    setFormValues(emptyFormValues)
    setFormErrorMessage('')
  }

  function handleFormChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target
    const fieldValue =
      event.target instanceof HTMLInputElement && event.target.type === 'checkbox'
        ? event.target.checked
        : value

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: fieldValue,
    }))
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormErrorMessage('')

    try {
      if (formMode === 'create') {
        if (formValues.createLoginAccount && !formValues.email.trim()) {
          setFormErrorMessage('Email is required when creating a login account.')
          return
        }

        await createStudentMutation.mutateAsync(buildCreatePayload(formValues))
        return
      }

      const existingStudent = selectedStudentQuery.data
      if (!existingStudent || selectedStudentId === null) {
        setFormErrorMessage('Student details are still loading. Please try again.')
        return
      }

      await updateStudentMutation.mutateAsync({
        id: selectedStudentId,
        payload: buildUpdatePayload(formValues, existingStudent),
      })
    } catch (error) {
      setFormErrorMessage(
        getErrorMessage(error, 'Unable to save student details right now.'),
      )
    }
  }

  async function handleDeactivate(student: StudentResponse) {
    const shouldDeactivate = window.confirm(
      `Deactivate ${student.firstName} ${student.lastName}?`,
    )

    if (!shouldDeactivate) {
      return
    }

    try {
      await deactivateStudentMutation.mutateAsync(student.id)
    } catch (error) {
      window.alert(
        getErrorMessage(error, 'Unable to deactivate the selected student.'),
      )
    }
  }

  const isSubmitting =
    createStudentMutation.isPending || updateStudentMutation.isPending

  return (
    <>
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                Student Management
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                Keep student records current and easy to scan
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Search students, review contact details, and update active records
                from one clean dashboard table.
              </p>
            </div>

            <button
              className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
              onClick={openCreateModal}
              type="button"
            >
              Add Student
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">Student Directory</p>
              <p className="mt-1 text-sm text-slate-500">
                Filter by name, email, or phone number.
              </p>
            </div>

            <label className="block w-full md:max-w-sm">
              <span className="sr-only">Search students</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search students"
                value={searchValue}
              />
            </label>
          </div>
        </div>

        {studentsQuery.isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
              />
            ))}
          </div>
        ) : studentsQuery.isError ? (
          <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
            <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
              Unable to Load
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Student data could not be fetched
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Check that the API is running and try loading the student list again.
            </p>
            <button
              className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => void studentsQuery.refetch()}
              type="button"
            >
              Retry Student Load
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Empty State
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              {searchValue ? 'No students matched your search' : 'No students found'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {searchValue
                ? 'Try a different name, email, or phone number.'
                : 'Create the first student record to start managing enrollments and class participation.'}
            </p>
            {!searchValue ? (
              <button
                className="mt-6 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                onClick={openCreateModal}
                type="button"
              >
                Add First Student
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
                    <th className="px-6 py-4">Email / Phone</th>
                    <th className="px-6 py-4">Date of Birth</th>
                    <th className="px-6 py-4">Login</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="align-top text-sm text-slate-700">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-950">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="mt-1 max-w-xs text-slate-500">
                          {student.address || 'No address provided'}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p>{student.email || 'No email provided'}</p>
                        <p className="mt-1 text-slate-500">
                          {student.phoneNumber || 'No phone number'}
                        </p>
                      </td>
                      <td className="px-6 py-5">{formatDate(student.dateOfBirth)}</td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            student.hasLoginAccount
                              ? 'bg-sky-50 text-sky-700 ring-sky-200'
                              : 'bg-slate-100 text-slate-700 ring-slate-200'
                          }`}
                        >
                          {student.hasLoginAccount ? 'Linked' : 'Profile only'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            student.isActive
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                              : 'bg-slate-100 text-slate-700 ring-slate-200'
                          }`}
                        >
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5">{formatDateTime(student.createdAt)}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                            onClick={() => openEditModal(student.id)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={
                              !student.isActive ||
                              deactivateStudentMutation.isPending
                            }
                            onClick={() => void handleDeactivate(student)}
                            type="button"
                          >
                            {student.isActive ? 'Deactivate' : 'Inactive'}
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
        <StudentFormModal
          errorMessage={formErrorMessage}
          formValues={formValues}
          isLoadingStudent={selectedStudentQuery.isLoading}
          isSubmitting={isSubmitting}
          mode={formMode}
          onChange={handleFormChange}
          onClose={closeModal}
          onSubmit={handleFormSubmit}
        />
      ) : null}
    </>
  )
}
