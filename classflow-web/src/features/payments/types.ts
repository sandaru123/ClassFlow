export type PaymentMethod = 0 | 1 | 2 | 3 | 4

export type PaymentStatus = 0 | 1 | 2 | 3 | 4

export type PaymentResponse = {
  id: number
  studentId: number
  studentName: string
  courseId: number
  courseName: string
  amount: number
  paidAmount: number
  balanceAmount: number
  paymentMonth: number
  paymentYear: number
  paymentMethod: PaymentMethod | null
  paymentStatus: PaymentStatus
  paymentDate: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export type CreatePaymentRequest = {
  studentId: number
  courseId: number
  amount: number
  paymentMonth: number
  paymentYear: number
  paymentMethod: PaymentMethod | null
  paymentStatus: PaymentStatus
  notes: string | null
}

export type UpdatePaymentRequest = {
  studentId: number
  courseId: number
  amount: number
  paidAmount: number
  paymentMonth: number
  paymentYear: number
  paymentMethod: PaymentMethod | null
  paymentStatus: PaymentStatus
  paymentDate: string | null
  notes: string | null
  isActive: boolean
}

export type RecordPaymentRequest = {
  paidAmount: number
  paymentMethod: PaymentMethod | null
  paymentDate: string | null
  notes: string | null
}
