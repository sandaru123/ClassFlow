import { useQuery } from '@tanstack/react-query'
import {
  getMyAttendance,
  getMyCourses,
  getMyDocuments,
  getMyPayments,
  getMyUpcomingClasses,
} from '../features/student-portal/api'
import {
  formatCurrency,
  formatDateTime,
  formatFileSize,
  formatPaymentPeriod,
  getClassModeLabel,
  getClassStatusBadgeClasses,
  getClassStatusLabel,
  getDocumentVisibilityBadgeClasses,
  getDocumentVisibilityLabel,
  getPaymentStatusBadgeClasses,
  getPaymentStatusLabel,
} from '../features/student-portal/utils'

export function StudentDashboardPage() {
  const coursesQuery = useQuery({
    queryKey: ['student-portal', 'courses'],
    queryFn: getMyCourses,
  })

  const upcomingClassesQuery = useQuery({
    queryKey: ['student-portal', 'upcoming-classes'],
    queryFn: getMyUpcomingClasses,
  })

  const paymentsQuery = useQuery({
    queryKey: ['student-portal', 'payments'],
    queryFn: getMyPayments,
  })

  const attendanceQuery = useQuery({
    queryKey: ['student-portal', 'attendance'],
    queryFn: getMyAttendance,
  })

  const documentsQuery = useQuery({
    queryKey: ['student-portal', 'documents'],
    queryFn: getMyDocuments,
  })

  const isLoading =
    coursesQuery.isLoading ||
    upcomingClassesQuery.isLoading ||
    paymentsQuery.isLoading ||
    attendanceQuery.isLoading ||
    documentsQuery.isLoading

  const isError =
    coursesQuery.isError ||
    upcomingClassesQuery.isError ||
    paymentsQuery.isError ||
    attendanceQuery.isError ||
    documentsQuery.isError

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
            Student Portal
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Loading your dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Fetching your courses, classes, payments, attendance, and documents.
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
            Unable to load your student dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Your student portal data could not be fetched right now. Refresh the page
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
  const upcomingClasses = upcomingClassesQuery.data ?? []
  const payments = paymentsQuery.data ?? []
  const attendance = attendanceQuery.data ?? []
  const documents = documentsQuery.data ?? []

  const pendingPayments = payments.filter(
    (payment) =>
      payment.balanceAmount > 0 &&
      (payment.paymentStatus === 0 ||
        payment.paymentStatus === 1 ||
        payment.paymentStatus === 3),
  )
  const pendingPaymentAmount = pendingPayments.reduce(
    (total, payment) => total + payment.balanceAmount,
    0,
  )
  const nextClass = upcomingClasses[0] ?? null
  const recentDocuments = documents.slice(0, 3)
  const attendanceCounts = {
    present: attendance.filter((item) => item.status === 0).length,
    absent: attendance.filter((item) => item.status === 1).length,
    late: attendance.filter((item) => item.status === 2).length,
    excused: attendance.filter((item) => item.status === 3).length,
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Student Portal
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Stay on top of classes, payments, and shared materials
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Review your courses, check the next class, track outstanding balances,
              and see the latest available class documents from one dashboard.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Pending Amount
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {formatCurrency(pendingPaymentAmount)}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Across {pendingPayments.length} payment record
              {pendingPayments.length === 1 ? '' : 's'}
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
          <p className="text-sm font-medium text-slate-500">Upcoming Classes</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {upcomingClasses.length}
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Pending Payments</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {pendingPayments.length}
          </p>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Attendance Records</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {attendance.length}
          </p>
        </article>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Next Class
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Your next scheduled session
            </h2>
          </div>

          {nextClass ? (
            <div className="space-y-4 px-6 py-6">
              <div>
                <p className="text-lg font-semibold text-slate-950">{nextClass.title}</p>
                <p className="mt-1 text-sm text-slate-500">{nextClass.courseName}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  {getClassModeLabel(nextClass.classMode)}
                </span>
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getClassStatusBadgeClasses(
                    nextClass.status,
                  )}`}
                >
                  {getClassStatusLabel(nextClass.status)}
                </span>
              </div>
              <p className="text-sm text-slate-600">
                {formatDateTime(nextClass.startTime)} to{' '}
                {formatDateTime(nextClass.endTime)}
              </p>
              {nextClass.meetingUrl ? (
                <a
                  className="inline-flex rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
                  href={nextClass.meetingUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open Meeting Link
                </a>
              ) : null}
            </div>
          ) : (
            <div className="px-6 py-10 text-sm text-slate-500">
              No upcoming classes are scheduled right now.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Attendance Summary
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Your marked attendance
            </h2>
          </div>

          {attendance.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              No attendance records are available yet.
            </div>
          ) : (
            <div className="grid gap-4 px-6 py-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-700">Present</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-900">
                  {attendanceCounts.present}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-medium text-rose-700">Absent</p>
                <p className="mt-2 text-2xl font-semibold text-rose-900">
                  {attendanceCounts.absent}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-700">Late</p>
                <p className="mt-2 text-2xl font-semibold text-amber-900">
                  {attendanceCounts.late}
                </p>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
                <p className="text-sm font-medium text-sky-700">Excused</p>
                <p className="mt-2 text-2xl font-semibold text-sky-900">
                  {attendanceCounts.excused}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Recent Documents
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Latest available materials
            </h2>
          </div>

          {recentDocuments.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              No documents are available yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentDocuments.map((document) => (
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

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Payment Snapshot
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
              Recent payment records
            </h2>
          </div>

          {payments.length === 0 ? (
            <div className="px-6 py-10 text-sm text-slate-500">
              No payment records are available yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {payments.slice(0, 3).map((payment) => (
                <article key={payment.paymentId} className="px-6 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{payment.courseName}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatPaymentPeriod(payment.paymentMonth, payment.paymentYear)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Balance {formatCurrency(payment.balanceAmount)}
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getPaymentStatusBadgeClasses(
                        payment.paymentStatus,
                      )}`}
                    >
                      {getPaymentStatusLabel(payment.paymentStatus)}
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
