import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { loginRequest, refreshTokenRequest } from '../../api/auth'
import { configureApiClientAuth } from '../../api/client'
import type { AuthSession, AuthUser, LoginRequest } from '../../types/auth'
import {
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from './authStorage'
import { mapAuthResponseToSession } from './roleUtils'

type AuthContextValue = {
  accessToken: string | null
  isAuthenticated: boolean
  login: (payload: LoginRequest) => Promise<AuthSession>
  logout: () => void
  refreshSession: () => Promise<AuthSession | null>
  user: AuthUser | null
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession())
  const sessionRef = useRef<AuthSession | null>(session)

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  const applySession = useCallback((nextSession: AuthSession) => {
    setStoredSession(nextSession)
    sessionRef.current = nextSession
    setSession(nextSession)
    return nextSession
  }, [])

  const clearSession = useCallback(() => {
    clearStoredSession()
    sessionRef.current = null
    setSession(null)
  }, [])

  const login = useCallback(
    async (payload: LoginRequest) => {
      const response = await loginRequest(payload)
      return applySession(mapAuthResponseToSession(response))
    },
    [applySession],
  )

  const refreshSession = useCallback(async () => {
    const activeSession = sessionRef.current
    if (!activeSession?.refreshToken) {
      return null
    }

    try {
      const response = await refreshTokenRequest({
        refreshToken: activeSession.refreshToken,
      })

      return applySession(mapAuthResponseToSession(response))
    } catch {
      clearSession()
      return null
    }
  }, [applySession, clearSession])

  const logout = useCallback(() => {
    clearSession()
  }, [clearSession])

  useEffect(() => {
    configureApiClientAuth({
      getAccessToken: () => sessionRef.current?.accessToken ?? null,
      hasRefreshToken: () => Boolean(sessionRef.current?.refreshToken),
      onAuthFailure: () => {
        clearSession()
        window.location.replace('/login')
      },
      refreshSession,
    })
  }, [clearSession, refreshSession])

  const value: AuthContextValue = {
    accessToken: session?.accessToken ?? null,
    isAuthenticated: Boolean(session?.accessToken),
    login,
    logout,
    refreshSession,
    user: session?.user ?? null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.')
  }

  return context
}
