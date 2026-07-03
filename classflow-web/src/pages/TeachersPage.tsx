import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  createTeacher,
  deactivateTeacher,
  getTeacherById,
  getTeachers,
  updateTeacher,
} from '../features/teachers/api'
import type {
  CreateTeacherRequest,
  TeacherResponse,
  UpdateTeacherRequest,
} from '../features/teachers/types'

type TeacherFormMode = 'create' | 'edit'

type TeacherFormValues = {
  firstName: string
  lastName: string
  email: string
  temporaryPassword: string
  createLoginAccount: boolean
  phoneNumber: string
  address: string
}

const emptyFormValues: TeacherFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  temporaryPassword: '',
  createLoginAccount: true,
  phoneNumber: '',
  address: '',
}

function toOptionalString(value: string): string | null {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

function toTeacherFormValues(teacher: TeacherResponse): TeacherFormValues {
  return {
    firstName: teacher.firstName,
    lastName: teacher.lastName,
    email: teacher.email ?? '',
    temporaryPassword: '',
    createLoginAccount: teacher.hasLoginAccount,
    phoneNumber: teacher.phoneNumber ?? '',
    address: teacher.address ?? '',
  }
}

function buildCreatePayload(values: TeacherFormValues): CreateTeacherRequest {
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
  }
}

function buildUpdatePayload(
  values: TeacherFormValues,
  existingTeacher: TeacherResponse,
): UpdateTeacherRequest {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    email: toOptionalString(values.email),
    phoneNumber: toOptionalString(values.phoneNumber),
    address: toOptionalString(values.address),
    isActive: existingTeacher.isActive,
  }
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

function TeacherFormModal({
  errorMessage,
  formValues,
  isLoadingTeacher,
  isSubmitting,
  mode,
  onChange,
  onClose,
  onSubmit,
}: {
  errorMessage: string
  formValues: TeacherFormValues
  isLoadingTeacher: boolean
  isSubmitting: boolean
  mode: TeacherFormMode
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
                {mode === 'create' ? 'Add Teacher' : 'Edit Teacher'}
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {mode === 'create'
                  ? 'Create a new teacher record'
                  : 'Update teacher details'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Keep teacher records clean so course assignment and schedule
                management can fit smoothly into later Phase 1 work.
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

        {isLoadingTeacher ? (
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
                  Use the exact teacher fields supported by the backend.
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
                        Creates an ASP.NET Identity user for this teacher and assigns
                        the Teacher role.
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
                    ? 'Create Teacher'
                    : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export function TeachersPage() {
  const queryClient = useQueryClient()
  const [searchValue, setSearchValue] = useState('')
  const [formMode, setFormMode] = useState<TeacherFormMode>('create')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null)
  const [formValues, setFormValues] = useState<TeacherFormValues>(emptyFormValues)
  const [formErrorMessage, setFormErrorMessage] = useState('')

  const teachersQuery = useQuery({
    queryKey: ['teachers'],
    queryFn: getTeachers,
  })

  const selectedTeacherQuery = useQuery({
    queryKey: ['teachers', selectedTeacherId],
    queryFn: () => getTeacherById(selectedTeacherId as number),
    enabled: isModalOpen && formMode === 'edit' && selectedTeacherId !== null,
  })

  useEffect(() => {
    if (selectedTeacherQuery.data) {
      setFormValues(toTeacherFormValues(selectedTeacherQuery.data))
    }
  }, [selectedTeacherQuery.data])

  const createTeacherMutation = useMutation({
    mutationFn: createTeacher,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teachers'] })
      closeModal()
    },
  })

  const updateTeacherMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTeacherRequest }) =>
      updateTeacher(id, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['teachers'] }),
        queryClient.invalidateQueries({ queryKey: ['teachers', variables.id] }),
      ])
      closeModal()
    },
  })

  const deactivateTeacherMutation = useMutation({
    mutationFn: deactivateTeacher,
    onSuccess: async (_, teacherId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['teachers'] }),
        queryClient.invalidateQueries({ queryKey: ['teachers', teacherId] }),
      ])
    },
  })

  const filteredTeachers = useMemo(() => {
    const teachers = teachersQuery.data ?? []
    const normalizedSearch = searchValue.trim().toLowerCase()

    if (!normalizedSearch) {
      return teachers
    }

    return teachers.filter((teacher) => {
      const searchableFields = [
        `${teacher.firstName} ${teacher.lastName}`,
        teacher.email ?? '',
        teacher.phoneNumber ?? '',
      ]

      return searchableFields.some((field) =>
        field.toLowerCase().includes(normalizedSearch),
      )
    })
  }, [searchValue, teachersQuery.data])

  function openCreateModal() {
    setFormMode('create')
    setSelectedTeacherId(null)
    setFormValues(emptyFormValues)
    setFormErrorMessage('')
    setIsModalOpen(true)
  }

  function openEditModal(teacherId: number) {
    setFormMode('edit')
    setSelectedTeacherId(teacherId)
    setFormValues(emptyFormValues)
    setFormErrorMessage('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setSelectedTeacherId(null)
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

        await createTeacherMutation.mutateAsync(buildCreatePayload(formValues))
        return
      }

      const existingTeacher = selectedTeacherQuery.data
      if (!existingTeacher || selectedTeacherId === null) {
        setFormErrorMessage('Teacher details are still loading. Please try again.')
        return
      }

      await updateTeacherMutation.mutateAsync({
        id: selectedTeacherId,
        payload: buildUpdatePayload(formValues, existingTeacher),
      })
    } catch (error) {
      setFormErrorMessage(
        getErrorMessage(error, 'Unable to save teacher details right now.'),
      )
    }
  }

  async function handleDeactivate(teacher: TeacherResponse) {
    const shouldDeactivate = window.confirm(
      `Deactivate ${teacher.firstName} ${teacher.lastName}?`,
    )

    if (!shouldDeactivate) {
      return
    }

    try {
      await deactivateTeacherMutation.mutateAsync(teacher.id)
    } catch (error) {
      window.alert(
        getErrorMessage(error, 'Unable to deactivate the selected teacher.'),
      )
    }
  }

  const isSubmitting =
    createTeacherMutation.isPending || updateTeacherMutation.isPending

  return (
    <>
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                Teacher Management
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                Keep teacher records clear and easy to manage
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Search teachers, review contact details, and update active
                teaching records from one clean admin table.
              </p>
            </div>

            <button
              className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
              onClick={openCreateModal}
              type="button"
            >
              Add Teacher
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">Teacher Directory</p>
              <p className="mt-1 text-sm text-slate-500">
                Filter by name, email, or phone number.
              </p>
            </div>

            <label className="block w-full md:max-w-sm">
              <span className="sr-only">Search teachers</span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search teachers"
                value={searchValue}
              />
            </label>
          </div>
        </div>

        {teachersQuery.isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
              />
            ))}
          </div>
        ) : teachersQuery.isError ? (
          <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
            <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
              Unable to Load
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Teacher data could not be fetched
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Check that the API is running and try loading the teacher list again.
            </p>
            <button
              className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => void teachersQuery.refetch()}
              type="button"
            >
              Retry Teacher Load
            </button>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Empty State
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              {searchValue ? 'No teachers matched your search' : 'No teachers found'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {searchValue
                ? 'Try a different name, email, or phone number.'
                : 'Create the first teacher record to start managing teaching staff.'}
            </p>
            {!searchValue ? (
              <button
                className="mt-6 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                onClick={openCreateModal}
                type="button"
              >
                Add First Teacher
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-6 py-4">Teacher</th>
                    <th className="px-6 py-4">Email / Phone</th>
                    <th className="px-6 py-4">Login</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id} className="align-top text-sm text-slate-700">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-950">
                          {teacher.firstName} {teacher.lastName}
                        </p>
                        <p className="mt-1 max-w-xs text-slate-500">
                          {teacher.address || 'No address provided'}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p>{teacher.email || 'No email provided'}</p>
                        <p className="mt-1 text-slate-500">
                          {teacher.phoneNumber || 'No phone number'}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            teacher.hasLoginAccount
                              ? 'bg-sky-50 text-sky-700 ring-sky-200'
                              : 'bg-slate-100 text-slate-700 ring-slate-200'
                          }`}
                        >
                          {teacher.hasLoginAccount ? 'Linked' : 'Profile only'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            teacher.isActive
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                              : 'bg-slate-100 text-slate-700 ring-slate-200'
                          }`}
                        >
                          {teacher.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5">{formatDateTime(teacher.createdAt)}</td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                            onClick={() => openEditModal(teacher.id)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={
                              !teacher.isActive ||
                              deactivateTeacherMutation.isPending
                            }
                            onClick={() => void handleDeactivate(teacher)}
                            type="button"
                          >
                            {teacher.isActive ? 'Deactivate' : 'Inactive'}
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
        <TeacherFormModal
          errorMessage={formErrorMessage}
          formValues={formValues}
          isLoadingTeacher={selectedTeacherQuery.isLoading}
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
