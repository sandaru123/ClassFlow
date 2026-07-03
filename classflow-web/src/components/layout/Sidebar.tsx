import { NavLink } from 'react-router-dom'

export type NavigationItem = {
  label: string
  to: string
}

type SidebarProps = {
  items: NavigationItem[]
  portalLabel: string
}

export function Sidebar({ items, portalLabel }: SidebarProps) {
  return (
    <aside className="border-b border-slate-200 bg-slate-950 text-slate-100 lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r lg:border-slate-800">
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-800 px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
            {portalLabel}
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">ClassFlow</h1>
          <p className="mt-2 text-sm text-slate-400">
            Phase 1 dashboard shell for admins, teachers, and students.
          </p>
        </div>

        <nav className="flex gap-3 overflow-x-auto px-4 py-4 lg:flex-1 lg:flex-col lg:overflow-x-visible">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition',
                  isActive
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-900/20'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}
