import { useQuery } from '@tanstack/react-query'
import { getMyCourses } from '../features/student-portal/api'
import { formatCurrency, formatDateTime } from '../features/student-portal/utils'

export function StudentCoursesPage() {
  const coursesQuery = useQuery({
    queryKey: ['student-portal', 'courses'],
    queryFn: getMyCourses,
  })

  if (coursesQuery.isLoading) {
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

  if (coursesQuery.isError) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
          Unable to Load
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          Your course list could not be fetched
        </h1>
      </div>
    )
  }

  const courses = coursesQuery.data ?? []

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
          My Courses
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Review your enrolled courses
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Check the teacher, monthly fee, and enrollment date for each active course.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            No active courses found
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your active course list will appear here once enrollments are available.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <article
              key={course.courseId}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-lg font-semibold text-slate-950">{course.courseName}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {course.description || 'No course description provided.'}
              </p>
              <dl className="mt-5 grid gap-3 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4">
                  <dt>Teacher</dt>
                  <dd className="font-medium text-slate-950">{course.teacherName}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Monthly Fee</dt>
                  <dd className="font-medium text-slate-950">
                    {formatCurrency(course.monthlyFee)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Enrolled</dt>
                  <dd className="font-medium text-slate-950">
                    {formatDateTime(course.enrolledAt)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
