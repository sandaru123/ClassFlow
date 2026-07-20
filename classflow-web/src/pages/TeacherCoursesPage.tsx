import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getMyTeacherCourses } from '../features/teacher-portal/api'
import { formatCurrency, formatDateTime } from '../features/teacher-portal/utils'

export function TeacherCoursesPage() {
  const navigate = useNavigate()
  const coursesQuery = useQuery({
    queryKey: ['teacher-portal', 'courses'],
    queryFn: getMyTeacherCourses,
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
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Check that the API is running and try loading your assigned courses again.
        </p>
        <button
          className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          onClick={() => void coursesQuery.refetch()}
          type="button"
        >
          Retry Course Load
        </button>
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
          Review your assigned courses
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          This page shows only the courses assigned to your teacher account.
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            No assigned courses found
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Courses assigned to you will appear here.
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
                  <dt>Monthly Fee</dt>
                  <dd className="font-medium text-slate-950">
                    {formatCurrency(course.monthlyFee)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Status</dt>
                  <dd>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                        course.isActive
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                          : 'bg-slate-100 text-slate-700 ring-slate-200'
                      }`}
                    >
                      {course.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt>Created</dt>
                  <dd className="font-medium text-slate-950">
                    {formatDateTime(course.createdAt)}
                  </dd>
                </div>
              </dl>
              <div className="mt-5">
                <button
                  className="rounded-2xl border border-sky-200 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
                  onClick={() => navigate(`/teacher/courses/${course.courseId}`)}
                  type="button"
                >
                  Open Course
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
