import { useMutation, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Link, useParams } from 'react-router-dom'
import {
  downloadStudentDocument,
  getMyCourseById,
} from '../features/student-portal/api'
import {
  formatCurrency,
  formatDateTime,
  formatFileSize,
  getClassModeLabel,
  getClassStatusBadgeClasses,
  getClassStatusLabel,
  getDocumentVisibilityBadgeClasses,
  getDocumentVisibilityLabel,
  getEnrollmentStatusBadgeClasses,
  getEnrollmentStatusLabel,
} from '../features/student-portal/utils'
import type { MyCourseSessionDocumentResponse } from '../features/student-portal/types'

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallbackMessage
  }

  return fallbackMessage
}

export function StudentCourseDetailsPage() {
  const { courseId } = useParams()
  const parsedCourseId = Number(courseId)

  const courseQuery = useQuery({
    queryKey: ['student-portal', 'courses', parsedCourseId],
    queryFn: () => getMyCourseById(parsedCourseId),
    enabled: Number.isFinite(parsedCourseId),
  })

  const downloadMutation = useMutation({
    mutationFn: async ({
      documentId,
      fileName,
    }: {
      documentId: number
      fileName: string
    }) => {
      const blob = await downloadStudentDocument(documentId)
      return { blob, fileName }
    },
    onSuccess: ({ blob, fileName }) => {
      const objectUrl = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = objectUrl
      link.download = fileName
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    },
  })

  async function handleDownload(document: MyCourseSessionDocumentResponse) {
    try {
      await downloadMutation.mutateAsync({
        documentId: document.documentId,
        fileName: document.originalFileName,
      })
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to download the selected document.'))
    }
  }

  if (!Number.isFinite(parsedCourseId)) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        Invalid course route.
      </div>
    )
  }

  if (courseQuery.isLoading) {
    return (
      <div className="grid gap-4">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
          />
        ))}
      </div>
    )
  }

  if (courseQuery.isError || !courseQuery.data) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
          Unable to Load
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          This course workspace could not be loaded
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The course may no longer be available to your student account, or the API
          is currently unavailable.
        </p>
        <button
          className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          onClick={() => void courseQuery.refetch()}
          type="button"
        >
          Retry Course Load
        </button>
      </div>
    )
  }

  const course = courseQuery.data

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              className="text-sm font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
              to="/student/courses"
            >
              Back to Courses
            </Link>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getEnrollmentStatusBadgeClasses(
                  course.enrollmentStatus,
                )}`}
              >
                {getEnrollmentStatusLabel(course.enrollmentStatus)}
              </span>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Course Workspace
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              {course.courseName}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              {course.description || 'No course description has been added yet.'}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Monthly Fee
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {formatCurrency(course.monthlyFee)}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Enrolled {formatDateTime(course.enrolledAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Teacher</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {course.teacherName || 'Not assigned'}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {course.teacherEmail || 'No teacher email available'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {course.teacherPhoneNumber || 'No teacher phone number available'}
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Enrollment Status</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {getEnrollmentStatusLabel(course.enrollmentStatus)}
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Class Sessions</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
            {course.sessions.length}
          </p>
        </article>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Class sessions for this course
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review your sessions, meeting links, and document availability in one place.
          </p>
        </div>

        {course.sessions.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-950">No sessions available yet</h3>
            <p className="mt-2 text-sm text-slate-600">
              Sessions for this course will appear here once they are scheduled.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {course.sessions.map((session) => (
              <article
                key={session.classSessionId}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">{session.title}</h3>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getClassStatusBadgeClasses(
                          session.status,
                        )}`}
                      >
                        {getClassStatusLabel(session.status)}
                      </span>
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                        {getClassModeLabel(session.classMode)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {session.description || 'No session description provided.'}
                    </p>
                    <dl className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                      <div>
                        <dt className="font-medium text-slate-500">Starts</dt>
                        <dd className="mt-1">{formatDateTime(session.startTime)}</dd>
                      </div>
                      <div>
                        <dt className="font-medium text-slate-500">Ends</dt>
                        <dd className="mt-1">{formatDateTime(session.endTime)}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex flex-col gap-3 lg:min-w-56">
                    {session.meetingUrl && session.status !== 3 ? (
                      <a
                        className="inline-flex rounded-2xl bg-sky-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-sky-600"
                        href={session.meetingUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open Meeting Link
                      </a>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-500">
                        {session.status === 3
                          ? 'Meeting link unavailable for cancelled sessions.'
                          : 'No meeting link available.'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Session Documents
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Download only the documents currently available to your account.
                      </p>
                    </div>
                  </div>

                  {session.documents.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                      No documents have been added for this session yet.
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {session.documents.map((document) => (
                        <div
                          key={document.documentId}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-slate-950">{document.title}</p>
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                                    document.isAvailable
                                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                      : 'bg-amber-50 text-amber-700 ring-amber-200'
                                  }`}
                                >
                                  {document.isAvailable ? 'Available' : 'Locked'}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-slate-500">
                                {document.originalFileName}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {document.description || document.availabilityMessage}
                              </p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getDocumentVisibilityBadgeClasses(
                                    document.visibilityType,
                                  )}`}
                                >
                                  {getDocumentVisibilityLabel(document.visibilityType)}
                                </span>
                                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                  {formatFileSize(document.fileSizeInBytes)}
                                </span>
                              </div>
                              <p className="mt-3 text-sm text-slate-500">
                                {document.availabilityMessage}
                              </p>
                            </div>

                            <div className="flex min-w-44 flex-col gap-3">
                              <p className="text-sm text-slate-500">
                                Uploaded {formatDateTime(document.uploadedAt)}
                              </p>
                              <button
                                className="rounded-2xl border border-sky-200 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
                                disabled={!document.isAvailable || downloadMutation.isPending}
                                onClick={() => void handleDownload(document)}
                                type="button"
                              >
                                {downloadMutation.isPending
                                  ? 'Downloading...'
                                  : 'Download'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
