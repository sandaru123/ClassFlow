import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  getMyTeacherClassSessions,
  getMyTeacherUpcomingClasses,
} from '../features/teacher-portal/api'
import {
  formatDateTime,
  getClassModeLabel,
  getClassStatusBadgeClasses,
  getClassStatusLabel,
} from '../features/teacher-portal/utils'

export function TeacherClassSessionsPage() {
  const navigate = useNavigate()
  const classSessionsQuery = useQuery({
    queryKey: ['teacher-portal', 'class-sessions'],
    queryFn: getMyTeacherClassSessions,
  })

  const upcomingClassesQuery = useQuery({
    queryKey: ['teacher-portal', 'upcoming-classes'],
    queryFn: getMyTeacherUpcomingClasses,
  })

  if (classSessionsQuery.isLoading || upcomingClassesQuery.isLoading) {
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

  if (classSessionsQuery.isError || upcomingClassesQuery.isError) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
          Unable to Load
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          Your class sessions could not be fetched
        </h1>
        <button
          className="mt-4 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
          onClick={() => {
            void classSessionsQuery.refetch()
            void upcomingClassesQuery.refetch()
          }}
          type="button"
        >
          Retry Session Load
        </button>
      </div>
    )
  }

  const classSessions = classSessionsQuery.data ?? []
  const upcomingClasses = upcomingClassesQuery.data ?? []

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
          My Class Sessions
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Review your assigned class sessions
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          This page shows only the class sessions assigned to your teacher account.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Upcoming Classes</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {upcomingClasses.length}
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">All Sessions</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {classSessions.length}
          </p>
        </article>
      </div>

      {classSessions.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            No assigned class sessions found
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Class sessions assigned to you will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-6 py-4">Session</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Mode</th>
                  <th className="px-6 py-4">Meeting</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {classSessions.map((classSession) => (
                  <tr key={classSession.classSessionId} className="align-top text-sm text-slate-700">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-950">{classSession.title}</p>
                      <p className="mt-1 text-slate-500">
                        {classSession.description || 'No description provided'}
                      </p>
                    </td>
                    <td className="px-6 py-5">{classSession.courseName}</td>
                    <td className="px-6 py-5">
                      <p>{formatDateTime(classSession.startTime)}</p>
                      <p className="mt-1 text-slate-500">
                        Ends {formatDateTime(classSession.endTime)}
                      </p>
                    </td>
                    <td className="px-6 py-5">{getClassModeLabel(classSession.classMode)}</td>
                    <td className="px-6 py-5">
                      <p>{classSession.meetingProvider || 'No provider set'}</p>
                      {classSession.meetingUrl ? (
                        <a
                          className="mt-1 inline-flex text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
                          href={classSession.meetingUrl}
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
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getClassStatusBadgeClasses(
                          classSession.status,
                        )}`}
                      >
                        {getClassStatusLabel(classSession.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                          onClick={() =>
                            navigate(`/teacher/courses/${classSession.courseId}`)
                          }
                          type="button"
                        >
                          Open Course
                        </button>
                        <button
                          className="rounded-xl border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                          onClick={() =>
                            navigate(
                              `/teacher/courses/${classSession.courseId}/sessions/${classSession.classSessionId}`,
                            )
                          }
                          type="button"
                        >
                          View Session
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
  )
}
