import { apiClient } from '../../api/client'
import type { AdminDashboardResponse } from './types'

export async function getAdminDashboard(): Promise<AdminDashboardResponse> {
  const response = await apiClient.get<AdminDashboardResponse>('/dashboard/admin')
  return response.data
}
