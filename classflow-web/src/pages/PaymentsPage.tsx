import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { getCourses } from '../features/courses/api'
import type { CourseResponse } from '../features/courses/types'
import {
  cancelPayment,
  createPayment,
  getPaymentById,
  getPayments,
  getPaymentsByCourseId,
  getPaymentsByStudentId,
  getPendingPayments,
  recordPayment,
  updatePayment,
} from '../features/payments/api'
import type {
  CreatePaymentRequest,
  PaymentMethod,
  PaymentResponse,
  PaymentStatus,
  RecordPaymentRequest,
  UpdatePaymentRequest,
} from '../features/payments/types'
import { getStudents } from '../features/students/api'
import type { StudentResponse } from '../features/students/types'

type PaymentFormMode = 'create' | 'edit'
type ActiveModal = 'payment-form' | 'record-payment' | null
type PaymentStatusFilter =
  | 'all'
  | 'pending'
  | 'partially-paid'
  | 'paid'
  | 'overdue'
  | 'cancelled'

type PaymentFormValues = {
  studentId: string
  courseId: string
  amount: string
  paymentMonth: string
  paymentYear: string
  paymentMethod: string
  paymentStatus: PaymentStatus
  notes: string
  paidAmount: string
  paymentDate: string
  isActive: boolean
}

type RecordPaymentFormValues = {
  paidAmount: string
  paymentMethod: string
  paymentDate: string
  notes: string
}

const paymentStatusOptions: Array<{ value: PaymentStatus; label: string }> = [
  { value: 0, label: 'Pending' },
  { value: 1, label: 'Partially Paid' },
  { value: 2, label: 'Paid' },
  { value: 3, label: 'Overdue' },
  { value: 4, label: 'Cancelled' },
]

const paymentMethodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: 0, label: 'Cash' },
  { value: 1, label: 'Bank Transfer' },
  { value: 2, label: 'Card' },
  { value: 3, label: 'Cheque' },
  { value: 4, label: 'Other' },
]

const emptyPaymentFormValues: PaymentFormValues = {
  studentId: '',
  courseId: '',
  amount: '',
  paymentMonth: '',
  paymentYear: String(new Date().getFullYear()),
  paymentMethod: '',
  paymentStatus: 0,
  notes: '',
  paidAmount: '0',
  paymentDate: '',
  isActive: true,
}

const emptyRecordPaymentFormValues: RecordPaymentFormValues = {
  paidAmount: '',
  paymentMethod: '',
  paymentDate: '',
  notes: '',
}

function toOptionalString(value: string): string | null {
  const trimmedValue = value.trim()
  return trimmedValue ? trimmedValue : null
}

function toOptionalPaymentMethod(value: string): PaymentMethod | null {
  return value ? (Number(value) as PaymentMethod) : null
}

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Not recorded'
  }

  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  }).format(value)
}

function formatPaymentPeriod(month: number, year: number) {
  return new Intl.DateTimeFormat('en-LK', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? fallbackMessage
  }

  return fallbackMessage
}

function getPaymentStatusLabel(status: PaymentStatus) {
  return (
    paymentStatusOptions.find((option) => option.value === status)?.label ??
    'Unknown'
  )
}

function getPaymentMethodLabel(paymentMethod: PaymentMethod | null) {
  if (paymentMethod === null) {
    return 'Not set'
  }

  return (
    paymentMethodOptions.find((option) => option.value === paymentMethod)?.label ??
    'Unknown'
  )
}

function getStatusBadgeClasses(status: PaymentStatus) {
  switch (status) {
    case 0:
      return 'bg-amber-50 text-amber-700 ring-amber-200'
    case 1:
      return 'bg-sky-50 text-sky-700 ring-sky-200'
    case 2:
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    case 3:
      return 'bg-rose-50 text-rose-700 ring-rose-200'
    case 4:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
  }
}

function matchesStatusFilter(
  payment: PaymentResponse,
  statusFilter: PaymentStatusFilter,
) {
  switch (statusFilter) {
    case 'pending':
      return payment.paymentStatus === 0
    case 'partially-paid':
      return payment.paymentStatus === 1
    case 'paid':
      return payment.paymentStatus === 2
    case 'overdue':
      return payment.paymentStatus === 3
    case 'cancelled':
      return payment.paymentStatus === 4
    default:
      return true
  }
}

function toPaymentFormValues(payment: PaymentResponse): PaymentFormValues {
  return {
    studentId: String(payment.studentId),
    courseId: String(payment.courseId),
    amount: String(payment.amount),
    paymentMonth: String(payment.paymentMonth),
    paymentYear: String(payment.paymentYear),
    paymentMethod:
      payment.paymentMethod === null ? '' : String(payment.paymentMethod),
    paymentStatus: payment.paymentStatus,
    notes: payment.notes ?? '',
    paidAmount: String(payment.paidAmount),
    paymentDate: payment.paymentDate ? payment.paymentDate.slice(0, 16) : '',
    isActive: payment.isActive,
  }
}

function buildCreatePayload(values: PaymentFormValues): CreatePaymentRequest {
  return {
    studentId: Number(values.studentId),
    courseId: Number(values.courseId),
    amount: Number(values.amount),
    paymentMonth: Number(values.paymentMonth),
    paymentYear: Number(values.paymentYear),
    paymentMethod: toOptionalPaymentMethod(values.paymentMethod),
    paymentStatus: values.paymentStatus,
    notes: toOptionalString(values.notes),
  }
}

function buildUpdatePayload(values: PaymentFormValues): UpdatePaymentRequest {
  return {
    studentId: Number(values.studentId),
    courseId: Number(values.courseId),
    amount: Number(values.amount),
    paidAmount: Number(values.paidAmount),
    paymentMonth: Number(values.paymentMonth),
    paymentYear: Number(values.paymentYear),
    paymentMethod: toOptionalPaymentMethod(values.paymentMethod),
    paymentStatus: values.paymentStatus,
    paymentDate: values.paymentDate
      ? new Date(values.paymentDate).toISOString()
      : null,
    notes: toOptionalString(values.notes),
    isActive: values.isActive,
  }
}

function buildRecordPaymentPayload(
  values: RecordPaymentFormValues,
): RecordPaymentRequest {
  return {
    paidAmount: Number(values.paidAmount),
    paymentMethod: toOptionalPaymentMethod(values.paymentMethod),
    paymentDate: values.paymentDate ? new Date(values.paymentDate).toISOString() : null,
    notes: toOptionalString(values.notes),
  }
}

function PaymentFormModal({
  courses,
  errorMessage,
  formValues,
  isLoadingDependencies,
  isLoadingPayment,
  isSubmitting,
  mode,
  onChange,
  onClose,
  onSubmit,
  students,
}: {
  courses: CourseResponse[]
  errorMessage: string
  formValues: PaymentFormValues
  isLoadingDependencies: boolean
  isLoadingPayment: boolean
  isSubmitting: boolean
  mode: PaymentFormMode
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  students: StudentResponse[]
}) {
  const hasStudents = students.length > 0
  const hasCourses = courses.length > 0
  const canSubmit = hasStudents && hasCourses && !isSubmitting

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                {mode === 'create' ? 'Add Payment' : 'Edit Payment'}
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                {mode === 'create'
                  ? 'Create a new payment record'
                  : 'Update payment details'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Keep manual fee tracking clear without adding any Phase 2 gateway
                or receipt flow.
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

        {isLoadingPayment || isLoadingDependencies ? (
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
                <p className="text-sm font-semibold text-slate-950">Payment Setup</p>
                <p className="mt-1 text-sm text-slate-500">
                  Choose the student, course, billing period, and base amount.
                </p>
              </div>

              {!hasStudents ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No students exist yet. Create a student before adding a payment.
                </div>
              ) : null}

              {!hasCourses ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No courses exist yet. Create a course before adding a payment.
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Student
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    disabled={!hasStudents}
                    name="studentId"
                    onChange={onChange}
                    required
                    value={formValues.studentId}
                  >
                    <option value="">Select a student</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.firstName} {student.lastName}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Course
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    disabled={!hasCourses}
                    name="courseId"
                    onChange={onChange}
                    required
                    value={formValues.courseId}
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Amount
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    min="0.01"
                    name="amount"
                    onChange={onChange}
                    required
                    step="0.01"
                    type="number"
                    value={formValues.amount}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Payment Month
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    max="12"
                    min="1"
                    name="paymentMonth"
                    onChange={onChange}
                    required
                    type="number"
                    value={formValues.paymentMonth}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Payment Year
                  </span>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    max="9999"
                    min="2000"
                    name="paymentYear"
                    onChange={onChange}
                    required
                    type="number"
                    value={formValues.paymentYear}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Payment Method
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    name="paymentMethod"
                    onChange={onChange}
                    value={formValues.paymentMethod}
                  >
                    <option value="">Not set</option>
                    {paymentMethodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-700">
                    Payment Status
                  </span>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                    name="paymentStatus"
                    onChange={onChange}
                    value={String(formValues.paymentStatus)}
                  >
                    {paymentStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {mode === 'edit' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Paid Amount
                    </span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                      min="0"
                      name="paidAmount"
                      onChange={onChange}
                      step="0.01"
                      type="number"
                      value={formValues.paidAmount}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">
                      Payment Date
                    </span>
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                      name="paymentDate"
                      onChange={onChange}
                      type="datetime-local"
                      value={formValues.paymentDate}
                    />
                  </label>
                </div>
              ) : null}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Notes
                </span>
                <textarea
                  className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  name="notes"
                  onChange={onChange}
                  value={formValues.notes}
                />
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
                  ? mode === 'create'
                    ? 'Creating...'
                    : 'Saving...'
                  : mode === 'create'
                    ? 'Create Payment'
                    : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function RecordPaymentModal({
  balanceAmount,
  errorMessage,
  formValues,
  isLoadingPayment,
  isSubmitting,
  onChange,
  onClose,
  onSubmit,
  paymentTitle,
}: {
  balanceAmount: number
  errorMessage: string
  formValues: RecordPaymentFormValues
  isLoadingPayment: boolean
  isSubmitting: boolean
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  paymentTitle: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Record Payment
              </span>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                Record a manual payment
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Update the outstanding balance for {paymentTitle} without adding
                receipts or gateway processing.
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

        {isLoadingPayment ? (
          <div className="space-y-4 px-6 py-8 sm:px-8">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-14 animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        ) : (
          <form className="space-y-6 px-6 py-8 sm:px-8" onSubmit={onSubmit}>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Outstanding Balance</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                {formatCurrency(balanceAmount)}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Paid Amount
                </span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  min="0.01"
                  name="paidAmount"
                  onChange={onChange}
                  required
                  step="0.01"
                  type="number"
                  value={formValues.paidAmount}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Payment Method
                </span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  name="paymentMethod"
                  onChange={onChange}
                  value={formValues.paymentMethod}
                >
                  <option value="">Not set</option>
                  {paymentMethodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Payment Date
              </span>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="paymentDate"
                onChange={onChange}
                type="datetime-local"
                value={formValues.paymentDate}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Notes
              </span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                name="notes"
                onChange={onChange}
                value={formValues.notes}
              />
            </label>

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
                className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-emerald-300"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export function PaymentsPage() {
  const queryClient = useQueryClient()
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)
  const [formMode, setFormMode] = useState<PaymentFormMode>('create')
  const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>('all')
  const [studentFilter, setStudentFilter] = useState('')
  const [courseFilter, setCourseFilter] = useState('')
  const [paymentFormValues, setPaymentFormValues] =
    useState<PaymentFormValues>(emptyPaymentFormValues)
  const [recordFormValues, setRecordFormValues] = useState<RecordPaymentFormValues>(
    emptyRecordPaymentFormValues,
  )
  const [paymentFormErrorMessage, setPaymentFormErrorMessage] = useState('')
  const [recordFormErrorMessage, setRecordFormErrorMessage] = useState('')

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: getStudents,
  })

  const coursesQuery = useQuery({
    queryKey: ['courses'],
    queryFn: getCourses,
  })

  const paymentsQuery = useQuery({
    queryKey: ['payments', 'list-source', statusFilter, studentFilter, courseFilter],
    queryFn: async () => {
      if (statusFilter === 'pending' && !studentFilter && !courseFilter) {
        return getPendingPayments()
      }

      if (studentFilter && !courseFilter && statusFilter === 'all') {
        return getPaymentsByStudentId(Number(studentFilter))
      }

      if (courseFilter && !studentFilter && statusFilter === 'all') {
        return getPaymentsByCourseId(Number(courseFilter))
      }

      return getPayments()
    },
  })

  const selectedPaymentQuery = useQuery({
    queryKey: ['payments', selectedPaymentId],
    queryFn: () => getPaymentById(selectedPaymentId as number),
    enabled: activeModal !== null && selectedPaymentId !== null,
  })

  useEffect(() => {
    if (
      activeModal === 'payment-form' &&
      formMode === 'edit' &&
      selectedPaymentQuery.data
    ) {
      setPaymentFormValues(toPaymentFormValues(selectedPaymentQuery.data))
    }
  }, [activeModal, formMode, selectedPaymentQuery.data])

  useEffect(() => {
    if (activeModal === 'record-payment' && selectedPaymentQuery.data) {
      setRecordFormValues({
        paidAmount:
          selectedPaymentQuery.data.balanceAmount > 0
            ? String(selectedPaymentQuery.data.balanceAmount)
            : '',
        paymentMethod:
          selectedPaymentQuery.data.paymentMethod === null
            ? ''
            : String(selectedPaymentQuery.data.paymentMethod),
        paymentDate: new Date().toISOString().slice(0, 16),
        notes: selectedPaymentQuery.data.notes ?? '',
      })
    }
  }, [activeModal, selectedPaymentQuery.data])

  const createPaymentMutation = useMutation({
    mutationFn: createPayment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['payments'] })
      closeModal()
    },
  })

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePaymentRequest }) =>
      updatePayment(id, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
        queryClient.invalidateQueries({ queryKey: ['payments', variables.id] }),
      ])
      closeModal()
    },
  })

  const recordPaymentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RecordPaymentRequest }) =>
      recordPayment(id, payload),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
        queryClient.invalidateQueries({ queryKey: ['payments', variables.id] }),
      ])
      closeModal()
    },
  })

  const cancelPaymentMutation = useMutation({
    mutationFn: cancelPayment,
    onSuccess: async (_, paymentId) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payments'] }),
        queryClient.invalidateQueries({ queryKey: ['payments', paymentId] }),
      ])
    },
  })

  const filteredPayments = useMemo(() => {
    const payments = paymentsQuery.data ?? []

    return payments.filter((payment) => {
      if (!matchesStatusFilter(payment, statusFilter)) {
        return false
      }

      if (studentFilter && payment.studentId !== Number(studentFilter)) {
        return false
      }

      if (courseFilter && payment.courseId !== Number(courseFilter)) {
        return false
      }

      return true
    })
  }, [courseFilter, paymentsQuery.data, statusFilter, studentFilter])

  function openCreateModal() {
    setFormMode('create')
    setSelectedPaymentId(null)
    setPaymentFormValues({
      ...emptyPaymentFormValues,
      paymentMonth: String(new Date().getMonth() + 1),
    })
    setPaymentFormErrorMessage('')
    setActiveModal('payment-form')
  }

  function openEditModal(paymentId: number) {
    setFormMode('edit')
    setSelectedPaymentId(paymentId)
    setPaymentFormValues(emptyPaymentFormValues)
    setPaymentFormErrorMessage('')
    setActiveModal('payment-form')
  }

  function openRecordPaymentModal(paymentId: number) {
    setSelectedPaymentId(paymentId)
    setRecordFormValues(emptyRecordPaymentFormValues)
    setRecordFormErrorMessage('')
    setActiveModal('record-payment')
  }

  function closeModal() {
    setActiveModal(null)
    setSelectedPaymentId(null)
    setPaymentFormValues(emptyPaymentFormValues)
    setRecordFormValues(emptyRecordPaymentFormValues)
    setPaymentFormErrorMessage('')
    setRecordFormErrorMessage('')
  }

  function handlePaymentFormChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target
    const fieldValue =
      event.target instanceof HTMLInputElement && event.target.type === 'checkbox'
        ? event.target.checked
        : value

    setPaymentFormValues((currentValues) => ({
      ...currentValues,
      [name]: name === 'paymentStatus' ? Number(fieldValue) : fieldValue,
    }))
  }

  function handleRecordFormChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = event.target

    setRecordFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }))
  }

  async function handlePaymentFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPaymentFormErrorMessage('')

    if (!paymentFormValues.studentId) {
      setPaymentFormErrorMessage('Student is required.')
      return
    }

    if (!paymentFormValues.courseId) {
      setPaymentFormErrorMessage('Course is required.')
      return
    }

    if (!paymentFormValues.amount || Number(paymentFormValues.amount) <= 0) {
      setPaymentFormErrorMessage('Amount must be greater than zero.')
      return
    }

    if (
      !paymentFormValues.paymentMonth ||
      Number(paymentFormValues.paymentMonth) < 1 ||
      Number(paymentFormValues.paymentMonth) > 12
    ) {
      setPaymentFormErrorMessage('Payment month must be between 1 and 12.')
      return
    }

    if (
      !paymentFormValues.paymentYear ||
      Number(paymentFormValues.paymentYear) < 2000
    ) {
      setPaymentFormErrorMessage('Payment year must be 2000 or later.')
      return
    }

    try {
      if (formMode === 'create') {
        await createPaymentMutation.mutateAsync(buildCreatePayload(paymentFormValues))
        return
      }

      if (selectedPaymentId === null || !selectedPaymentQuery.data) {
        setPaymentFormErrorMessage('Payment details are still loading. Please try again.')
        return
      }

      await updatePaymentMutation.mutateAsync({
        id: selectedPaymentId,
        payload: buildUpdatePayload(paymentFormValues),
      })
    } catch (error) {
      setPaymentFormErrorMessage(
        getErrorMessage(error, 'Unable to save payment details right now.'),
      )
    }
  }

  async function handleRecordPaymentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRecordFormErrorMessage('')

    if (!recordFormValues.paidAmount || Number(recordFormValues.paidAmount) <= 0) {
      setRecordFormErrorMessage('Paid amount must be greater than zero.')
      return
    }

    if (selectedPaymentId === null) {
      setRecordFormErrorMessage('Payment details are still loading. Please try again.')
      return
    }

    try {
      await recordPaymentMutation.mutateAsync({
        id: selectedPaymentId,
        payload: buildRecordPaymentPayload(recordFormValues),
      })
    } catch (error) {
      setRecordFormErrorMessage(
        getErrorMessage(error, 'Unable to record payment right now.'),
      )
    }
  }

  async function handleCancelPayment(payment: PaymentResponse) {
    const shouldCancel = window.confirm(
      `Cancel the payment for ${payment.studentName} / ${payment.courseName}?`,
    )

    if (!shouldCancel) {
      return
    }

    try {
      await cancelPaymentMutation.mutateAsync(payment.id)
    } catch (error) {
      window.alert(getErrorMessage(error, 'Unable to cancel the selected payment.'))
    }
  }

  const pendingPaymentsCount = useMemo(
    () =>
      (paymentsQuery.data ?? []).filter((payment) => payment.paymentStatus === 0)
        .length,
    [paymentsQuery.data],
  )

  const isFormSubmitting =
    createPaymentMutation.isPending || updatePaymentMutation.isPending

  return (
    <>
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                Payment Management
              </span>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
                Track manual fees and balances in one clear table
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                Create monthly fee records, record manual payments, and keep payment
                status visible without adding online gateway features.
              </p>
            </div>

            <button
              className="rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
              onClick={openCreateModal}
              type="button"
            >
              Add Payment
            </button>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Status
                </span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  onChange={(event) =>
                    setStatusFilter(event.target.value as PaymentStatusFilter)
                  }
                  value={statusFilter}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="partially-paid">Partially Paid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Student
                </span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  onChange={(event) => setStudentFilter(event.target.value)}
                  value={studentFilter}
                >
                  <option value="">All students</option>
                  {(studentsQuery.data ?? []).map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.firstName} {student.lastName}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Course
                </span>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white"
                  onChange={(event) => setCourseFilter(event.target.value)}
                  value={courseFilter}
                >
                  <option value="">All courses</option>
                  {(coursesQuery.data ?? []).map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-950">Pending Snapshot</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {pendingPaymentsCount}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Payments currently marked as pending in the active result set.
            </p>
          </div>
        </div>

        {paymentsQuery.isLoading ? (
          <div className="grid gap-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="h-24 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm"
              />
            ))}
          </div>
        ) : paymentsQuery.isError ? (
          <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
            <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
              Unable to Load
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              Payment data could not be fetched
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Check that the API is running and try loading the payment list again.
            </p>
            <button
              className="mt-6 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={() => void paymentsQuery.refetch()}
              type="button"
            >
              Retry Payment Load
            </button>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Empty State
            </span>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              No payments match the current filters
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Adjust the status, student, or course filters, or create the first
              payment record to begin manual fee tracking.
            </p>
            <button
              className="mt-6 rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600"
              onClick={openCreateModal}
              type="button"
            >
              Add Payment
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-6 py-4">Student / Course</th>
                    <th className="px-6 py-4">Period</th>
                    <th className="px-6 py-4">Amounts</th>
                    <th className="px-6 py-4">Method / Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Notes</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="align-top text-sm text-slate-700">
                      <td className="px-6 py-5">
                        <p className="font-semibold text-slate-950">{payment.studentName}</p>
                        <p className="mt-1 text-slate-500">{payment.courseName}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-medium text-slate-950">
                          {formatPaymentPeriod(payment.paymentMonth, payment.paymentYear)}
                        </p>
                        <p className="mt-1 text-slate-500">
                          Created {formatDateTime(payment.createdAt)}
                        </p>
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
                          {formatDateTime(payment.paymentDate)}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-2">
                          <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusBadgeClasses(
                              payment.paymentStatus,
                            )}`}
                          >
                            {getPaymentStatusLabel(payment.paymentStatus)}
                          </span>
                          <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                              payment.isActive
                                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                : 'bg-slate-100 text-slate-700 ring-slate-200'
                            }`}
                          >
                            {payment.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="max-w-xs text-slate-500">
                          {payment.notes || 'No notes provided'}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                            onClick={() => openEditModal(payment.id)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-xl border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={
                              payment.paymentStatus === 4 ||
                              !payment.isActive ||
                              recordPaymentMutation.isPending
                            }
                            onClick={() => openRecordPaymentModal(payment.id)}
                            type="button"
                          >
                            Record Payment
                          </button>
                          <button
                            className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={
                              payment.paymentStatus === 4 ||
                              cancelPaymentMutation.isPending
                            }
                            onClick={() => void handleCancelPayment(payment)}
                            type="button"
                          >
                            {payment.paymentStatus === 4 ? 'Cancelled' : 'Cancel'}
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

      {activeModal === 'payment-form' ? (
        <PaymentFormModal
          courses={coursesQuery.data ?? []}
          errorMessage={paymentFormErrorMessage}
          formValues={paymentFormValues}
          isLoadingDependencies={studentsQuery.isLoading || coursesQuery.isLoading}
          isLoadingPayment={formMode === 'edit' && selectedPaymentQuery.isLoading}
          isSubmitting={isFormSubmitting}
          mode={formMode}
          onChange={handlePaymentFormChange}
          onClose={closeModal}
          onSubmit={handlePaymentFormSubmit}
          students={studentsQuery.data ?? []}
        />
      ) : null}

      {activeModal === 'record-payment' ? (
        <RecordPaymentModal
          balanceAmount={selectedPaymentQuery.data?.balanceAmount ?? 0}
          errorMessage={recordFormErrorMessage}
          formValues={recordFormValues}
          isLoadingPayment={selectedPaymentQuery.isLoading}
          isSubmitting={recordPaymentMutation.isPending}
          onChange={handleRecordFormChange}
          onClose={closeModal}
          onSubmit={handleRecordPaymentSubmit}
          paymentTitle={
            selectedPaymentQuery.data
              ? `${selectedPaymentQuery.data.studentName} / ${selectedPaymentQuery.data.courseName}`
              : 'the selected payment'
          }
        />
      ) : null}
    </>
  )
}
