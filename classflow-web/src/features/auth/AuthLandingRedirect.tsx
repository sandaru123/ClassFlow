import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { getHomePathFromRoles } from './roleUtils'

export function AuthLandingRedirect() {
  const { isAuthenticated, user } = useAuth()

  return (
    <Navigate
      replace
      to={isAuthenticated ? getHomePathFromRoles(user?.roles ?? []) : '/login'}
    />
  )
}
