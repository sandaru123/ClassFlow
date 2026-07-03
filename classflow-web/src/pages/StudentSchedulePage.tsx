import { useQuery } from '@tanstack/react-query'
import {
  getMyClassSessions,
  getMyUpcomingClasses,
} from '../features/student-portal/api'
import {
  formatDateTime,
  getClassModeLabel,
  getClassStatusBadgeClasses,
  getClassStatusLabel,
} from '../features/student-portal/utils'

export function StudentSchedulePage() {
  const upcomingClassesQuery = useQuery({
    queryKey: ['student-portal', 'upcoming-classes'],
    queryFn: getMyUpcomingClasses,
  })

  const classSessionsQuery = useQuery({
    queryKey: ['student-portal', 'class-sessions'],
    queryFn: getMyClassSessions,
  })

  if (upcomingClassesQuery.isLoading || classSessionsQuery.isLoading) {
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

  if (upcomingClassesQuery.isError || classSessionsQuery.isError) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
          Unable to Load
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          Your schedule could not be fetched
        </h1>
      </div>
    )
  }

  const upcomingClasses = upcomingClassesQuery.data ?? []
  const allClassSessions = classSessionsQuery.data ?? []

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
          My Schedule
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Track upcoming and recent class sessions
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Review the next classes on your schedule and revisit the full class session
          history for your active courses.
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
          <p className="text-sm font-medium text-slate-500">All Class Sessions</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {allClassSessions.length}
          </p>
        </article>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Upcoming Classes
          </h2>
        </div>

        {upcomingClasses.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            No upcoming classes are scheduled right now.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {upcomingClasses.map((classSession) => (
              <article key={classSession.classSessionId} className="px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-slate-950">{classSession.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{classSession.courseName}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {formatDateTime(classSession.startTime)} to{' '}
                      {formatDateTime(classSession.endTime)}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      {classSession.description || 'No session description provided.'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
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
                    {classSession.meetingUrl ? (
                      <a
                        className="inline-flex rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                        href={classSession.meetingUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open Meeting Link
                      </a>
                    ) : (
                      <span className="text-sm text-slate-500">No meeting link</span>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950">
            Full Session History
          </h2>
        </div>

        {allClassSessions.length === 0 ? (
          <div className="px-6 py-10 text-sm text-slate-500">
            No class sessions are available yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-6 py-4">Session</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Mode</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allClassSessions.map((classSession) => (
                  <tr key={classSession.classSessionId} className="align-top text-sm text-slate-700">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-950">{classSession.title}</p>
                      <p className="mt-1 text-slate-500">
                        {classSession.description || 'No description provided'}
                      </p>
                    </td>
                    <td className="px-6 py-5">{classSession.courseName}</td>
                    <td className="px-6 py-5">
                      {formatDateTime(classSession.startTime)}
                    </td>
                    <td className="px-6 py-5">{getClassModeLabel(classSession.classMode)}</td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getClassStatusBadgeClasses(
                          classSession.status,
                        )}`}
                      >
                        {getClassStatusLabel(classSession.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  )
}
