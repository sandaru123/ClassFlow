import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { getClassSessions } from '../features/class-sessions/api'
import type { ClassSessionResponse } from '../features/class-sessions/types'
import {
  deleteClassDocumentForever,
  deactivateClassDocument,
  getClassDocumentById,
  getClassDocuments,
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

type DocumentFormMode = 'upload' | 'edit'

type DocumentFormValues = {
  classSessionId: string
  title: string
  description: string
  file: File | null
  visibilityType: DocumentVisibilityType
}

const visibilityOptions: Array<{
  value: DocumentVisibilityType
  label: string
}> = [
  { value: 0, label: 'Available Immediately' },
  { value: 1, label: 'Before Class' },
  { value: 2, label: 'During Class' },
  { value: 3, label: 'After Class' },
  { value: 4, label: 'After Teacher Marks Completed' },
]

const emptyFormValues: DocumentFormValues = {
  classSessionId: '',
  title: '',
  description: '',
  file: null,
  visibilityType: 0,
}

function toOptionalString(value: string): string | null {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
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

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (error.response?.status === 409) {
      return 'This record cannot be permanently deleted because it has related data. Please deactivate it instead.'
    }

    return error.response?.data?.message ?? fallbackMessage
  }

  return fallbackMessage
}

function getVisibilityLabel(visibilityType: DocumentVisibilityType) {
  return (
    visibilityOptions.find((option) => option.value === visibilityType)?.label ??
    'Unknown'
  )
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

function toDocumentFormValues(document: ClassDocumentResponse): DocumentFormValues {
  return {
    classSessionId: String(document.classSessionId),
    title: document.title,
    description: document.description ?? '',
    file: null,
    visibilityType: document.visibilityType,
  }
}

function buildUploadPayload(values: DocumentFormValues): UploadClassDocumentRequest {
  return {
    classSessionId: Number(values.classSessionId),
    title: values.title.trim(),
    description: toOptionalString(values.description),
    file: values.file as File,
    visibilityType: values.visibilityType,
  }
}

function buildUpdatePayload(
  values: DocumentFormValues,
  existingDocument: ClassDocumentResponse,
): UpdateClassDocumentRequest {
  return {
    title: values.title.trim(),
    description: toOptionalString(values.description),
    visibilityType: values.visibilityType,
    isActive: existingDocument.isActive,
  }
}

function DocumentFormModal({
  classSessions,
  errorMessage,
  formValues,
  isLoadingDependencies,
  isLoadingDocument,
  isSubmitting,
  mode,
  onChange,
  onClose,
  onSubmit,
}: {
  classSessions: ClassSessionResponse[]
  errorMessage: string
  formValues: DocumentFormValues
  isLoadingDependencies: boolean
  isLoadingDocument: boolean
  isSubmitting: boolean
  mode: DocumentFormMode
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const hasClassSessions = classSessions.length > 0
  const canSubmit = hasClassSessions && !isSubmitting

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
                {mode === 'upload'
                  ? 'Upload a class document'
                  : 'Update document details'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Keep class files organized by session and visibility timing without
                exposing storage paths or adding preview features.
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

        {isLoadingDocument || isLoadingDependencies ? (
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
                <p className="text-sm font-semibold text-slate-950">Document Setup</p>
                <p className="mt-1 text-sm text-slate-500">
                  Select the class session, enter the document details, and choose
                  when it becomes visible.
                </p>
              </div>

              {!hasClassSessions ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No class sessions exist yet. Create a class session before uploading
                  a document.
                </div>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Class Session
                </span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  disabled={mode === 'edit' || !hasClassSessions}
                  name="classSessionId"
                  onChange={onChange}
                  required
                  value={formValues.classSessionId}
                >
                  <option value="">Select a class session</option>
                  {classSessions.map((classSession) => (
                    <option key={classSession.id} value={classSession.id}>
                      {classSession.title}
                    </option>
                  ))}
                </select>
              </label>

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

              {mode === 'upload' ? (
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    File
                  </span>
                  <input
                    className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 file:mr-4 file:rounded-xl file:border-0 file:bg-sky-500 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-sky-600"
                    name="file"
                    onChange={onChange}
                    required
                    type="file"
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Visibility Type
                </span>
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
                  ? mode === 'upload'
                    ? 'Uploading...'
                    : 'Saving...'
                  : mode === 'upload'
                    ? 'Upload Document'
                    : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export function DocumentsPage() {
  const queryClient = useQueryClient()
  const [formMode, setFormMode] = useState<DocumentFormMode>('upload')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null)
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('')
  const [recordFilter, setRecordFilter] = useState<'all' | 'active' | 'inactive'>(
    'all',
  )
  const [formValues, setFormValues] = useState<DocumentFormValues>(emptyFormValues)
  const [formErrorMessage, setFormErrorMessage] = useState('')

  const classSessionsQuery = useQuery({
    queryKey: ['class-sessions'],
    queryFn: getClassSessions,
  })

  const documentsQuery = useQuery({
    queryKey: ['class-documents', selectedSessionFilter || 'all'],
    queryFn: () =>
      selectedSessionFilter
        ? getClassDocumentsBySessionId(Number(selectedSessionFilter))
        : getClassDocuments(),
  })

  const selectedDocumentQuery = useQuery({
    queryKey: ['class-documents', selectedDocumentId],
    queryFn: () => getClassDocumentById(selectedDocumentId as number),
    enabled: isModalOpen && formMode === 'edit' && selectedDocumentId !== null,
  })

  useEffect(() => {
    if (selectedDocumentQuery.data) {
      setFormValues(toDocumentFormValues(selectedDocumentQuery.data))
    }
  }, [selectedDocumentQuery.data])

  const uploadDocumentMutation = useMutation({
    mutationFn: uploadClassDocument,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['class-documents'] })
      closeModal()
    },
  })

  const updateDocumentMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: UpdateClassDocumentRequest
    }) => updateClassDocument(id, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['class-documents'] }),
        queryClient.invalidateQueries({ queryKey: ['class-documents', variables.id] }),
      ])
      closeModal()
    },
  })

  const deactivateDocumentMutation = useMutation({
    mutationFn: deactivateClassDocument,
    onSuccess: async (_, documentId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['class-documents'] }),
        queryClient.invalidateQueries({ queryKey: ['class-documents', documentId] }),
      ])
    },
  })

  const reactivateDocumentMutation = useMutation({
    mutationFn: reactivateClassDocument,
    onSuccess: async (_, documentId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['class-documents'] }),
        queryClient.invalidateQueries({ queryKey: ['class-documents', documentId] }),
      ])
    },
  })

  const deleteDocumentForeverMutation = useMutation({
    mutationFn: deleteClassDocumentForever,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['class-documents'] })
    },
  })

  const sortedDocuments = useMemo(() => {
    const filteredDocuments = (documentsQuery.data ?? []).filter((document) =>
      recordFilter === 'all'
        ? true
        : recordFilter === 'active'
          ? document.isActive
          : !document.isActive,
    )

    return [...filteredDocuments].sort(
      (left, right) =>
        new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime(),
    )
  }, [documentsQuery.data, recordFilter])

  function openUploadModal() {
    setFormMode('upload')
    setSelectedDocumentId(null)
    setFormValues({
      ...emptyFormValues,
      classSessionId: selectedSessionFilter,
    })
    setFormErrorMessage('')
    setIsModalOpen(true)
  }

  function openEditModal(documentId: number) {
    setFormMode('edit')
    setSelectedDocumentId(documentId)
    setFormValues(emptyFormValues)
    setFormErrorMessage('')
    setIsModalOpen(true)
  }

  function closeModal() {
    setIsModalOpen(false)
    setSelectedDocumentId(null)
    setFormValues(emptyFormValues)
    setFormErrorMessage('')
  }

  function handleFormChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const target = event.target
    const { name, value } = target

    if (target instanceof HTMLInputElement && target.type === 'file') {
      setFormValues((currentValues) => ({
        ...currentValues,
        file: target.files?.[0] ?? null,
      }))
      return
    }

    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: name === 'visibilityType' ? Number(value) : value,
    }))
  }

  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormErrorMessage('')

    if (!formValues.classSessionId) {
      setFormErrorMessage('Class session is required.')
      return
    }

    if (!formValues.title.trim()) {
      setFormErrorMessage('Title is required.')
      return
    }

    try {
      if (formMode === 'upload') {
        if (!formValues.file) {
          setFormErrorMessage('Select a file to upload.')
          return
        }

        await uploadDocumentMutation.mutateAsync(buildUploadPayload(formValues))
        return
      }

      const existingDocument = selectedDocumentQuery.data
      if (!existingDocument || selectedDocumentId === null) {
        setFormErrorMessage('Document details are still loading. Please try again.')
        return
      }

      await updateDocumentMutation.mutateAsync({
        id: selectedDocumentId,
        payload: buildUpdatePayload(formValues, existingDocument),
      })
    } catch (error) {
      setFormErrorMessage(
        getErrorMessage(error, 'Unable to save document details right now.'),
      )
    }
  }

  async function handleDeactivate(document: ClassDocumentResponse) {
    const shouldDeactivate = window.confirm(`Deactivate "${document.title}"?`)

    if (!shouldDeactivate) {
      return
    }

    try {
      await deactivateDocumentMutation.mutateAsync(document.id)
    } catch (error) {
      window.alert(
        getErrorMessage(error, 'Unable to deactivate the selected document.'),
      )
    }
  }

  async function handleReactivate(document: ClassDocumentResponse) {
    const shouldReactivate = window.confirm(`Reactivate "${document.title}"?`)

    if (!shouldReactivate) {
      return
    }

    try {
      await reactivateDocumentMutation.mutateAsync(document.id)
    } catch (error) {
      window.alert(
        getErrorMessage(error, 'Unable to reactivate the selected document.'),
      )
    }
  }

  async function handleDeleteForever(document: ClassDocumentResponse) {
    const shouldDelete = window.confirm(
      `Delete "${document.title}" forever? This cannot be undone.`,
    )

    if (!shouldDelete) {
      return
    }

    try {
      await deleteDocumentForeverMutation.mutateAsync(document.id)
    } catch (error) {
      window.alert(
        getErrorMessage(error, 'Unable to permanently delete the selected document.'),
      )
    }
  }

  const isSubmitting =
    uploadDocumentMutation.isPending || updateDocumentMutation.isPending

  return (
    <>
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                Document Management
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                Organize class documents by session and visibility timing
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Upload session-linked files, manage visibility windows, and keep
                active document records easy to review in one Phase 1 table.
              </p>
            </div>

            <button
              className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
              onClick={openUploadModal}
              type="button"
            >
              Upload Document
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-950">Document Directory</p>
              <p className="mt-1 text-sm text-slate-500">
                Filter by class session and record state when you need a narrower view.
              </p>
            </div>

            <div className="grid w-full gap-3 md:max-w-2xl md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Class Session Filter
                </span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  onChange={(event) => setSelectedSessionFilter(event.target.value)}
                  value={selectedSessionFilter}
                >
                  <option value="">All class sessions</option>
                  {(classSessionsQuery.data ?? []).map((classSession) => (
                    <option key={classSession.id} value={classSession.id}>
                      {classSession.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Record State
                </span>
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
            </div>
          </div>
        </div>

        {documentsQuery.isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
              />
            ))}
          </div>
        ) : documentsQuery.isError ? (
          <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
            <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
              Unable to Load
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Document data could not be fetched
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Check that the API is running and try loading the document list again.
            </p>
            <button
              className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => void documentsQuery.refetch()}
              type="button"
            >
              Retry Document Load
            </button>
          </div>
        ) : sortedDocuments.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Empty State
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              {selectedSessionFilter
                ? 'No documents found for this class session'
                : 'No documents found'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {classSessionsQuery.data?.length
                ? 'Upload the first document to start organizing class materials.'
                : 'Create a class session first, then upload documents for it.'}
            </p>
            {classSessionsQuery.data?.length ? (
              <button
                className="mt-6 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                onClick={openUploadModal}
                type="button"
              >
                Upload First Document
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-6 py-4">Document</th>
                    <th className="px-6 py-4">Class Session</th>
                    <th className="px-6 py-4">File Details</th>
                    <th className="px-6 py-4">Visibility</th>
                    <th className="px-6 py-4">Uploaded</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedDocuments.map((document) => (
                    <tr key={document.id} className="align-top text-sm text-slate-700">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-950">{document.title}</p>
                        <p className="mt-1 text-slate-500">
                          {document.description || 'No description provided'}
                        </p>
                        <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                          {document.originalFileName}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        {document.classSessionTitle || 'No class session title'}
                      </td>
                      <td className="px-6 py-5">
                        <p>{document.fileType || 'Unknown file type'}</p>
                        <p className="mt-1 text-slate-500">
                          {formatFileSize(document.fileSizeInBytes)}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getVisibilityBadgeClasses(
                            document.visibilityType,
                          )}`}
                        >
                          {getVisibilityLabel(document.visibilityType)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <p>{formatDateTime(document.uploadedAt)}</p>
                        <p className="mt-1 text-slate-500">
                          {document.updatedAt
                            ? `Updated ${formatDateTime(document.updatedAt)}`
                            : 'Not updated'}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            document.isActive
                              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                              : 'bg-slate-100 text-slate-700 ring-slate-200'
                          }`}
                        >
                          {document.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                            onClick={() => openEditModal(document.id)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={
                              !document.isActive || deactivateDocumentMutation.isPending
                            }
                            onClick={() => void handleDeactivate(document)}
                            type="button"
                          >
                            {document.isActive ? 'Deactivate' : 'Inactive'}
                          </button>
                          <button
                            className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={
                              document.isActive || reactivateDocumentMutation.isPending
                            }
                            onClick={() => void handleReactivate(document)}
                            type="button"
                          >
                            Reactivate
                          </button>
                          <button
                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={deleteDocumentForeverMutation.isPending}
                            onClick={() => void handleDeleteForever(document)}
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
        <DocumentFormModal
          classSessions={classSessionsQuery.data ?? []}
          errorMessage={formErrorMessage}
          formValues={formValues}
          isLoadingDependencies={classSessionsQuery.isLoading}
          isLoadingDocument={selectedDocumentQuery.isLoading}
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
