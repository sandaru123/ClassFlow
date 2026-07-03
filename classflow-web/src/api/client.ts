import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosRequestConfig,
} from 'axios'

type AuthInterceptorOptions = {
  getAccessToken: () => string | null
  hasRefreshToken: () => boolean
  onAuthFailure: () => void
  refreshSession: () => Promise<unknown>
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

const baseURL = import.meta.env.VITE_API_BASE_URL

let authOptions: AuthInterceptorOptions | null = null
let isConfigured = false
let refreshPromise: Promise<unknown> | null = null

function shouldSkipAuthHandling(config?: AxiosRequestConfig): boolean {
  const url = config?.url ?? ''
  return url.includes('/auth/login') || url.includes('/auth/refresh-token')
}

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const rawApiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export function configureApiClientAuth(options: AuthInterceptorOptions): void {
  authOptions = options

  if (isConfigured) {
    return
  }

  isConfigured = true

  apiClient.interceptors.request.use((config) => {
    const accessToken = authOptions?.getAccessToken()
    if (accessToken) {
      config.headers.set('Authorization', `Bearer ${accessToken}`)
    }

    return config
  })

  apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const responseStatus = error.response?.status
      const originalRequest = error.config as RetryableRequestConfig | undefined

      if (
        responseStatus !== 401 ||
        !authOptions ||
        !originalRequest ||
        originalRequest._retry ||
        shouldSkipAuthHandling(originalRequest) ||
        !authOptions.hasRefreshToken()
      ) {
        return Promise.reject(error)
      }

      originalRequest._retry = true

      try {
        refreshPromise ??= authOptions.refreshSession().finally(() => {
          refreshPromise = null
        })
        await refreshPromise

        const refreshedAccessToken = authOptions.getAccessToken()
        if (!refreshedAccessToken) {
          authOptions.onAuthFailure()
          return Promise.reject(error)
        }

        originalRequest.headers.set(
          'Authorization',
          `Bearer ${refreshedAccessToken}`,
        )

        return apiClient(originalRequest)
      } catch (refreshError) {
        authOptions.onAuthFailure()
        return Promise.reject(refreshError)
      }
    },
  )
}
