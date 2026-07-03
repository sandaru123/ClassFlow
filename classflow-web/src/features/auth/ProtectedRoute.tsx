import type { PropsWithChildren } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { getHomePathFromRoles } from './roleUtils'
import type { UserRole } from '../../types/auth'

type ProtectedRouteProps = PropsWithChildren<{
  allowedRoles?: UserRole[]
}>

export function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  if (allowedRoles && !user?.roles.some((role) => allowedRoles.includes(role))) {
    return <Navigate replace to={getHomePathFromRoles(user?.roles ?? [])} />
  }

  return children ? <>{children}</> : <Outlet />
}
