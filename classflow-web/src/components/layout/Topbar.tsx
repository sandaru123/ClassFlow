import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/AuthContext'
import { formatRouteTitle } from '../../utils/formatRouteTitle'

type TopbarProps = {
  portalLabel: string
}

export function Topbar({ portalLabel }: TopbarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            {portalLabel}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
            {formatRouteTitle(location.pathname)}
          </h2>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">{user?.displayName ?? 'ClassFlow User'}</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
              {user?.role ?? 'Signed In'}
            </p>
            <p className="mt-1 text-xs text-slate-500">{user?.email ?? 'No email available'}</p>
          </div>
          <button
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-950"
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
