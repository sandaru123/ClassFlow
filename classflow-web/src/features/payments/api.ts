import { apiClient } from '../../api/client'
import type {
  CreatePaymentRequest,
  PaymentResponse,
  RecordPaymentRequest,
  UpdatePaymentRequest,
} from './types'

export async function getPayments(): Promise<PaymentResponse[]> {
  const response = await apiClient.get<PaymentResponse[]>('/payments')
  return response.data
}

export async function getPaymentById(id: number): Promise<PaymentResponse> {
  const response = await apiClient.get<PaymentResponse>(`/payments/${id}`)
  return response.data
}

export async function getPaymentsByStudentId(
  studentId: number,
): Promise<PaymentResponse[]> {
  const response = await apiClient.get<PaymentResponse[]>(
    `/payments/student/${studentId}`,
  )
  return response.data
}

export async function getPaymentsByCourseId(
  courseId: number,
): Promise<PaymentResponse[]> {
  const response = await apiClient.get<PaymentResponse[]>(
    `/payments/course/${courseId}`,
  )
  return response.data
}

export async function getPendingPayments(): Promise<PaymentResponse[]> {
  const response = await apiClient.get<PaymentResponse[]>('/payments/pending')
  return response.data
}

export async function createPayment(
  payload: CreatePaymentRequest,
): Promise<PaymentResponse> {
  const response = await apiClient.post<PaymentResponse>('/payments', payload)
  return response.data
}

export async function updatePayment(
  id: number,
  payload: UpdatePaymentRequest,
): Promise<PaymentResponse> {
  const response = await apiClient.put<PaymentResponse>(`/payments/${id}`, payload)
  return response.data
}

export async function recordPayment(
  id: number,
  payload: RecordPaymentRequest,
): Promise<PaymentResponse> {
  const response = await apiClient.patch<PaymentResponse>(`/payments/${id}/record`, {
    amount: payload.paidAmount,
    paymentMethod: payload.paymentMethod,
    paymentDate: payload.paymentDate,
    notes: payload.notes,
  })
  return response.data
}

export async function cancelPayment(id: number): Promise<PaymentResponse> {
  const response = await apiClient.patch<PaymentResponse>(`/payments/${id}/cancel`)
  return response.data
}
