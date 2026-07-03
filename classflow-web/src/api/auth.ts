import { rawApiClient } from './client'
import type { AuthResponse, LoginRequest } from '../types/auth'

type RefreshTokenRequest = {
  refreshToken: string
}

export async function loginRequest(payload: LoginRequest): Promise<AuthResponse> {
  const response = await rawApiClient.post<AuthResponse>('/auth/login', payload)
  return response.data
}

export async function refreshTokenRequest(
  payload: RefreshTokenRequest,
): Promise<AuthResponse> {
  const response = await rawApiClient.post<AuthResponse>(
    '/auth/refresh-token',
    payload,
  )
  return response.data
}
