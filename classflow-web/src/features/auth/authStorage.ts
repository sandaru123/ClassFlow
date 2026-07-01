import type { AuthSession } from '../../types/auth'

const storageKey = 'classflow.auth'

export function getStoredSession(): AuthSession | null {
  const storedValue = window.localStorage.getItem(storageKey)
  if (!storedValue) {
    return null
  }

  try {
    return JSON.parse(storedValue) as AuthSession
  } catch {
    window.localStorage.removeItem(storageKey)
    return null
  }
}

export function setStoredSession(session: AuthSession): void {
  window.localStorage.setItem(storageKey, JSON.stringify(session))
}

export function clearStoredSession(): void {
  window.localStorage.removeItem(storageKey)
}
