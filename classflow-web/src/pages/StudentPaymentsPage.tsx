import { useQuery } from '@tanstack/react-query'
import { getMyPayments } from '../features/student-portal/api'
import {
  formatCurrency,
  formatDateTime,
  formatPaymentPeriod,
  getPaymentMethodLabel,
  getPaymentStatusBadgeClasses,
  getPaymentStatusLabel,
} from '../features/student-portal/utils'

export function StudentPaymentsPage() {
  const paymentsQuery = useQuery({
    queryKey: ['student-portal', 'payments'],
    queryFn: getMyPayments,
  })

  if (paymentsQuery.isLoading) {
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

  if (paymentsQuery.isError) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
        <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
          Unable to Load
        </span>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
          Your payment history could not be fetched
        </h1>
      </div>
    )
  }

  const payments = paymentsQuery.data ?? []

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
          My Payments
        </span>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
          Review your payment history and balances
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Track monthly payment records, their current status, and any remaining
          balance for your enrolled courses.
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            No payment history found
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Payment records will appear here once they are created for your courses.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Period</th>
                  <th className="px-6 py-4">Amounts</th>
                  <th className="px-6 py-4">Method / Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((payment) => (
                  <tr key={payment.paymentId} className="align-top text-sm text-slate-700">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-950">{payment.courseName}</p>
                      <p className="mt-1 text-slate-500">
                        {payment.notes || 'No notes provided'}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      {formatPaymentPeriod(payment.paymentMonth, payment.paymentYear)}
                    </td>
                    <td className="px-6 py-5">
                      <p>Total {formatCurrency(payment.amount)}</p>
                      <p className="mt-1 text-slate-500">
                        Paid {formatCurrency(payment.paidAmount)}
                      </p>
                      <p className="mt-1 text-slate-500">
                        Balance {formatCurrency(payment.balanceAmount)}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <p>{getPaymentMethodLabel(payment.paymentMethod)}</p>
                      <p className="mt-1 text-slate-500">
                        {payment.paymentDate
                          ? formatDateTime(payment.paymentDate)
                          : 'Not recorded'}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getPaymentStatusBadgeClasses(
                          payment.paymentStatus,
                        )}`}
                      >
                        {getPaymentStatusLabel(payment.paymentStatus)}
                      </span>
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
