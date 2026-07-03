import axios from 'axios'
import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { getHomePathFromRoles } from '../features/auth/roleUtils'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const session = await login({
        email: email.trim(),
        password,
      })

      const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from
        ?.pathname
      navigate(fromPath ?? getHomePathFromRoles(session.user.roles), {
        replace: true,
      })
    } catch (error) {
      if (axios.isAxiosError<{ message?: string }>(error)) {
        setErrorMessage(
          error.response?.data?.message ?? 'Unable to sign in with those credentials.',
        )
      } else {
        setErrorMessage('Unable to sign in right now. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)]" />
      <section className="relative grid w-full max-w-6xl gap-8 overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-slate-950 px-8 py-10 text-white sm:px-10 sm:py-12">
          <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
            ClassFlow
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Run classes, schedules, and student access from one clean dashboard.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            Phase 1 keeps the experience focused: sign in quickly, land in the
            right portal, and get straight to courses, sessions, payments, and
            documents.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
                Admin and SuperAdmin
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Manage students, courses, enrollments, attendance, payments, and
                class materials from a single workspace.
              </p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
                Teacher and Student
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Teachers move between sessions and documents, while students get
                a simpler portal with upcoming classes and learning access.
              </p>
            </article>
          </div>

          <div className="mt-10 rounded-3xl border border-sky-400/20 bg-sky-400/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-200">
              Phase 1 priorities
            </p>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li>Role-based access for admin, teacher, and student portals</li>
              <li>Manual online meeting links and secure document access</li>
              <li>Simple, fast dashboard navigation built for day-to-day class work</li>
            </ul>
          </div>
        </div>

        <div className="px-8 py-10 sm:px-10 sm:py-12">
          <div className="max-w-md">
            <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              Welcome back
            </span>
          </div>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
            Sign in to ClassFlow
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
            Use your email and password to continue. You will be redirected to
            the correct dashboard based on your assigned role.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </span>
              <input
                autoComplete="email"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@classflow.test"
                required
                type="email"
                value={email}
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </span>
              <input
                autoComplete="current-password"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                required
                type="password"
                value={password}
              />
            </label>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <button
              className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-sky-300"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Secure Phase 1 access
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Access tokens are attached automatically for API requests, and
              refresh tokens keep the session alive without sending you back to
              the login screen on every expiry.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
