import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { getHomePathFromRoles } from './roleUtils'

export function PublicRoute({ children }: PropsWithChildren) {
  const { isAuthenticated, user } = useAuth()

  if (isAuthenticated) {
    return <Navigate replace to={getHomePathFromRoles(user?.roles ?? [])} />
  }

  return <>{children}</>
}
