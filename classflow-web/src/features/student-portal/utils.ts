import type {
  AttendanceStatus,
  ClassMode,
  ClassSessionStatus,
  DocumentVisibilityType,
  PaymentMethod,
  PaymentStatus,
} from './types'

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatPaymentPeriod(month: number, year: number) {
  return new Intl.DateTimeFormat('en-LK', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1))
}

export function getClassModeLabel(classMode: ClassMode) {
  switch (classMode) {
    case 0:
      return 'Physical'
    case 1:
      return 'Online'
    case 2:
      return 'Hybrid'
    default:
      return 'Unknown'
  }
}

export function getClassStatusLabel(status: ClassSessionStatus) {
  switch (status) {
    case 0:
      return 'Scheduled'
    case 1:
      return 'Ongoing'
    case 2:
      return 'Completed'
    case 3:
      return 'Cancelled'
    default:
      return 'Unknown'
  }
}

export function getClassStatusBadgeClasses(status: ClassSessionStatus) {
  switch (status) {
    case 0:
      return 'bg-sky-50 text-sky-700 ring-sky-200'
    case 1:
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    case 2:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
    case 3:
      return 'bg-rose-50 text-rose-700 ring-rose-200'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
  }
}

export function getPaymentMethodLabel(paymentMethod: PaymentMethod | null) {
  if (paymentMethod === null) {
    return 'Not set'
  }

  switch (paymentMethod) {
    case 0:
      return 'Cash'
    case 1:
      return 'Bank Transfer'
    case 2:
      return 'Card'
    case 3:
      return 'Cheque'
    case 4:
      return 'Other'
    default:
      return 'Unknown'
  }
}

export function getPaymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case 0:
      return 'Pending'
    case 1:
      return 'Partially Paid'
    case 2:
      return 'Paid'
    case 3:
      return 'Overdue'
    case 4:
      return 'Cancelled'
    default:
      return 'Unknown'
  }
}

export function getPaymentStatusBadgeClasses(status: PaymentStatus) {
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

export function getAttendanceStatusLabel(status: AttendanceStatus) {
  switch (status) {
    case 0:
      return 'Present'
    case 1:
      return 'Absent'
    case 2:
      return 'Late'
    case 3:
      return 'Excused'
    default:
      return 'Unknown'
  }
}

export function getAttendanceStatusBadgeClasses(status: AttendanceStatus) {
  switch (status) {
    case 0:
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    case 1:
      return 'bg-rose-50 text-rose-700 ring-rose-200'
    case 2:
      return 'bg-amber-50 text-amber-700 ring-amber-200'
    case 3:
      return 'bg-sky-50 text-sky-700 ring-sky-200'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
  }
}

export function getDocumentVisibilityLabel(visibilityType: DocumentVisibilityType) {
  switch (visibilityType) {
    case 0:
      return 'Available Immediately'
    case 1:
      return 'Before Class'
    case 2:
      return 'During Class'
    case 3:
      return 'After Class'
    case 4:
      return 'After Teacher Marks Completed'
    default:
      return 'Unknown'
  }
}

export function getDocumentVisibilityBadgeClasses(
  visibilityType: DocumentVisibilityType,
) {
  switch (visibilityType) {
    case 0:
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    case 1:
      return 'bg-sky-50 text-sky-700 ring-sky-200'
    case 2:
      return 'bg-amber-50 text-amber-700 ring-amber-200'
    case 3:
      return 'bg-violet-50 text-violet-700 ring-violet-200'
    case 4:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
    default:
      return 'bg-slate-100 text-slate-700 ring-slate-200'
  }
}
