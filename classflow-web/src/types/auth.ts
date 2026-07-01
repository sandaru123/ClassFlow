export type UserRole = 'SuperAdmin' | 'Admin' | 'Teacher' | 'Student' | 'Parent'

export type LoginRequest = {
  email: string
  password: string
}

export type AuthResponse = {
  userId: string
  firstName: string
  lastName: string
  email: string
  roles: string[]
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
  refreshTokenExpiresAt: string
}

export type AuthUser = {
  userId: string
  firstName: string
  lastName: string
  email: string
  displayName: string
  role: UserRole | null
  roles: UserRole[]
}

export type AuthSession = {
  accessToken: string
  accessTokenExpiresAt: string
  refreshToken: string
  refreshTokenExpiresAt: string
  user: AuthUser
}
