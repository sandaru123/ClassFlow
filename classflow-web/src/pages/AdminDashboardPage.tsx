import { useQuery } from '@tanstack/react-query'
import { getAdminDashboard } from '../features/admin-dashboard/api'
import type {
  AdminDashboardResponse,
  RecentPayment,
  UpcomingClass,
} from '../features/admin-dashboard/types'

const dashboardCardConfig: Array<{
  key: keyof Pick<
    AdminDashboardResponse,
    | 'totalStudents'
    | 'totalTeachers'
    | 'totalCourses'
    | 'activeEnrollments'
    | 'todayClasses'
    | 'upcomingClassesCount'
    | 'pendingPayments'
    | 'totalPendingAmount'
    | 'totalPaidAmountThisMonth'
  >
  label: string
  tone: 'default' | 'warning' | 'success'
  type?: 'currency'
}> = [
  { key: 'totalStudents', label: 'Total Students', tone: 'default' },
  { key: 'totalTeachers', label: 'Total Teachers', tone: 'default' },
  { key: 'totalCourses', label: 'Total Courses', tone: 'default' },
  { key: 'activeEnrollments', label: 'Active Enrollments', tone: 'default' },
  { key: 'todayClasses', label: 'Today Classes', tone: 'default' },
  { key: 'upcomingClassesCount', label: 'Upcoming Classes', tone: 'default' },
  { key: 'pendingPayments', label: 'Pending Payments', tone: 'warning' },
  {
    key: 'totalPendingAmount',
    label: 'Total Pending Amount',
    tone: 'warning',
    type: 'currency',
  },
  {
    key: 'totalPaidAmountThisMonth',
    label: 'Total Paid This Month',
    tone: 'success',
    type: 'currency',
  },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatTimeRange(startTime: string, endTime: string) {
  const formatter = new Intl.DateTimeFormat('en-LK', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return `${formatter.format(new Date(startTime))} - ${formatter.format(new Date(endTime))}`
}

function getPaymentStatusClasses(status: string) {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus === 'paid') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  }

  if (normalizedStatus === 'pending' || normalizedStatus === 'partiallypaid') {
    return 'bg-amber-50 text-amber-700 ring-amber-200'
  }

  if (normalizedStatus === 'overdue') {
    return 'bg-rose-50 text-rose-700 ring-rose-200'
  }

  return 'bg-slate-100 text-slate-700 ring-slate-200'
}

function getClassStatusClasses(status: string) {
  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus === 'scheduled') {
    return 'bg-sky-50 text-sky-700 ring-sky-200'
  }

  if (normalizedStatus === 'ongoing') {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  }

  if (normalizedStatus === 'cancelled') {
    return 'bg-rose-50 text-rose-700 ring-rose-200'
  }

  return 'bg-slate-100 text-slate-700 ring-slate-200'
}

function DashboardCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: 'default' | 'warning' | 'success'
}) {
  const accentClasses =
    tone === 'warning'
      ? 'from-amber-50 to-white text-amber-700'
      : tone === 'success'
        ? 'from-emerald-50 to-white text-emerald-700'
        : 'from-sky-50 to-white text-sky-700'

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`inline-flex rounded-2xl bg-gradient-to-br px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${accentClasses}`}
      >
        Summary
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </article>
  )
}

function RecentPaymentsSection({ payments }: { payments: RecentPayment[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Recent Payments
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
          Latest recorded payments
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Keep an eye on recent collections and payment status changes.
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="px-6 py-10 text-sm text-slate-500">
          No payments have been recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Course</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment) => (
                <tr key={payment.id} className="text-sm text-slate-700">
                  <td className="px-6 py-4 font-medium text-slate-950">
                    {payment.studentName}
                  </td>
                  <td className="px-6 py-4">{payment.courseName}</td>
                  <td className="px-6 py-4 font-medium">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="px-6 py-4">{payment.paymentMethod}</td>
                  <td className="px-6 py-4">{formatDateTime(payment.paymentDate)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getPaymentStatusClasses(payment.status)}`}
                    >
                      {payment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function UpcomingClassesSection({ classes }: { classes: UpcomingClass[] }) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Upcoming Classes
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">
          Sessions that need attention
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Review the next scheduled classes across courses and teachers.
        </p>
      </div>

      {classes.length === 0 ? (
        <div className="px-6 py-10 text-sm text-slate-500">
          No upcoming classes are scheduled yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Teacher</th>
                <th className="px-6 py-4">Schedule</th>
                <th className="px-6 py-4">Mode</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classes.map((upcomingClass) => (
                <tr key={upcomingClass.id} className="text-sm text-slate-700">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-950">{upcomingClass.title}</p>
                    <p className="mt-1 text-slate-500">{upcomingClass.courseName}</p>
                  </td>
                  <td className="px-6 py-4">{upcomingClass.teacherName}</td>
                  <td className="px-6 py-4">
                    <p>{formatDateTime(upcomingClass.startTime)}</p>
                    <p className="mt-1 text-slate-500">
                      {formatTimeRange(
                        upcomingClass.startTime,
                        upcomingClass.endTime,
                      )}
                    </p>
                  </td>
                  <td className="px-6 py-4">{upcomingClass.classMode}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getClassStatusClasses(upcomingClass.status)}`}
                    >
                      {upcomingClass.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function AdminDashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getAdminDashboard,
  })

  if (dashboardQuery.isLoading) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
            Admin Dashboard
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Loading dashboard overview
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Fetching student, course, class, and payment summaries for today.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }, (_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
            />
          ))}
        </div>
      </section>
    )
  }

  if (dashboardQuery.isError) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
          <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">
            Dashboard Error
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
            Unable to load the admin dashboard
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            The summary data could not be fetched right now. Try refreshing the
            page after confirming the API is running.
          </p>
          <button
            className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={() => void dashboardQuery.refetch()}
            type="button"
          >
            Retry Dashboard Load
          </button>
        </div>
      </section>
    )
  }

  const dashboard = dashboardQuery.data
  if (!dashboard) {
    return null
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Admin Dashboard
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              Daily class and payment overview
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              Track the operational health of ClassFlow at a glance with quick
              counts, recent payments, and the next scheduled classes.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              This month
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {formatCurrency(dashboard.totalPaidAmountThisMonth)}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Collected across manual payment records
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboardCardConfig.map((card) => {
          const rawValue = dashboard[card.key]
          const value =
            card.type === 'currency'
              ? formatCurrency(rawValue)
              : new Intl.NumberFormat('en-LK').format(rawValue)

          return (
            <DashboardCard
              key={card.key}
              label={card.label}
              tone={card.tone}
              value={value}
            />
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <RecentPaymentsSection payments={dashboard.recentPayments} />
        <UpcomingClassesSection classes={dashboard.upcomingClasses} />
      </div>
    </section>
  )
}
