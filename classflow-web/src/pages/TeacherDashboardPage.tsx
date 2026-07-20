import { useQuery } from '@tanstack/react-query'
import {
  getMyTeacherClassSessions,
  getMyTeacherCourses,
  getMyTeacherDocuments,
  getMyTeacherStudents,
  getMyTeacherUpcomingClasses,
} from '../features/teacher-portal/api'
import {
  formatDateTime,
  formatFileSize,
  getClassModeLabel,
  getClassStatusBadgeClasses,
  getClassStatusLabel,
  getDocumentVisibilityBadgeClasses,
  getDocumentVisibilityLabel,
} from '../features/teacher-portal/utils'

export function TeacherDashboardPage() {
  const coursesQuery = useQuery({
    queryKey: ['teacher-portal', 'courses'],
    queryFn: getMyTeacherCourses,
  })

  const classSessionsQuery = useQuery({
    queryKey: ['teacher-portal', 'class-sessions'],
    queryFn: getMyTeacherClassSessions,
  })

  const upcomingClassesQuery = useQuery({
    queryKey: ['teacher-portal', 'upcoming-classes'],
    queryFn: getMyTeacherUpcomingClasses,
  })

  const studentsQuery = useQuery({
    queryKey: ['teacher-portal', 'students'],
    queryFn: getMyTeacherStudents,
  })

  const documentsQuery = useQuery({
    queryKey: ['teacher-portal', 'documents'],
    queryFn: getMyTeacherDocuments,
  })

  const isLoading =
    coursesQuery.isLoading ||
    classSessionsQuery.isLoading ||
    upcomingClassesQuery.isLoading ||
    studentsQuery.isLoading ||
    documentsQuery.isLoading

  const isError =
    coursesQuery.isError ||
    classSessionsQuery.isError ||
    upcomingClassesQuery.isError ||
    studentsQuery.isError ||
    documentsQuery.isError

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
            Teacher Portal
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Loading your dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Fetching your courses, students, class sessions, and uploaded documents.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
            />
          ))}
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
          <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">
            Dashboard Error
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Unable to load your teacher dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Your teacher portal data could not be fetched right now. Refresh the page
            after confirming the API is running.
          </p>
          <button
            className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => window.location.reload()}
            type="button"
          >
            Retry Dashboard Load
          </button>
        </div>
      </section>
    )
  }

  const courses = coursesQuery.data ?? []
  const classSessions = classSessionsQuery.data ?? []
  const upcomingClasses = upcomingClassesQuery.data ?? []
  const students = studentsQuery.data ?? []
  const documents = documentsQuery.data ?? []

  const today = new Date()
  const todayClassCount = classSessions.filter((classSession) => {
    const classDate = new Date(classSession.startTime)
    return (
      classDate.getFullYear() === today.getFullYear() &&
      classDate.getMonth() === today.getMonth() &&
      classDate.getDate() === today.getDate()
    )
  }).length

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Teacher Portal
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Keep your classes, students, and materials in view
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Review assigned courses, track upcoming sessions, monitor attendance
              history, and keep recent class documents easy to scan.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Upcoming Classes
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {upcomingClasses.length}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Scheduled for your assigned class sessions
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">My Courses</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {courses.length}
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">My Students</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {students.length}
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Today Classes</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {todayClassCount}
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Uploaded Documents</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {documents.length}
          </p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Recent Class Sessions
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Latest assigned sessions
            </h2>
          </div>

          {classSessions.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              No class sessions are assigned yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {classSessions.slice(0, 4).map((classSession) => (
                <article key={classSession.classSessionId} className="px-6 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{classSession.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {classSession.courseName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDateTime(classSession.startTime)} to{' '}
                        {formatDateTime(classSession.endTime)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                        {getClassModeLabel(classSession.classMode)}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getClassStatusBadgeClasses(
                          classSession.status,
                        )}`}
                      >
                        {getClassStatusLabel(classSession.status)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Recent Documents
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Latest uploaded class materials
            </h2>
          </div>

          {documents.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              No documents have been uploaded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.slice(0, 4).map((document) => (
                <article key={document.documentId} className="px-6 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{document.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {document.classSessionTitle} | {document.originalFileName}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatFileSize(document.fileSizeInBytes)} |{' '}
                        {formatDateTime(document.uploadedAt)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getDocumentVisibilityBadgeClasses(
                        document.visibilityType,
                      )}`}
                    >
                      {getDocumentVisibilityLabel(document.visibilityType)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}
