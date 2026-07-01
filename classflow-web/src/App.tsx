import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { router } from './routes/router'
import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext'

function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
