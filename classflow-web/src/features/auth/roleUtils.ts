import type { AuthResponse, AuthSession, AuthUser, UserRole } from '../../types/auth'

const supportedRoles: UserRole[] = [
  'SuperAdmin',
  'Admin',
  'Teacher',
  'Student',
  'Parent',
]

const rolePriority: UserRole[] = [
  'SuperAdmin',
  'Admin',
  'Teacher',
  'Student',
  'Parent',
]

export function normalizeRoles(roles: string[]): UserRole[] {
  return roles.filter((role): role is UserRole =>
    supportedRoles.includes(role as UserRole),
  )
}

export function getPrimaryRole(roles: UserRole[]): UserRole | null {
  for (const role of rolePriority) {
    if (roles.includes(role)) {
      return role
    }
  }

  return null
}

export function getRoleHomePath(role: UserRole | null): string {
  switch (role) {
    case 'SuperAdmin':
    case 'Admin':
      return '/admin/dashboard'
    case 'Teacher':
      return '/teacher/dashboard'
    case 'Student':
      return '/student/dashboard'
    default:
      return '/login'
  }
}

export function getHomePathFromRoles(roles: UserRole[]): string {
  return getRoleHomePath(getPrimaryRole(roles))
}

export function buildDisplayName(firstName: string, lastName: string, email: string): string {
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || email
}

export function mapAuthResponseToSession(response: AuthResponse): AuthSession {
  const roles = normalizeRoles(response.roles)
  const user: AuthUser = {
    userId: response.userId,
    firstName: response.firstName,
    lastName: response.lastName,
    email: response.email,
    displayName: buildDisplayName(
      response.firstName,
      response.lastName,
      response.email,
    ),
    role: getPrimaryRole(roles),
    roles,
  }

  return {
    accessToken: response.accessToken,
    accessTokenExpiresAt: response.accessTokenExpiresAt,
    refreshToken: response.refreshToken,
    refreshTokenExpiresAt: response.refreshTokenExpiresAt,
    user,
  }
}
