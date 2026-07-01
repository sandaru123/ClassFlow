import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import type { NavigationItem } from './Sidebar'
import { Topbar } from './Topbar'

type AppLayoutProps = {
  navigation: NavigationItem[]
  portalLabel: string
}

export function AppLayout({ navigation, portalLabel }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <Sidebar items={navigation} portalLabel={portalLabel} />
      <div className="lg:pl-72">
        <Topbar portalLabel={portalLabel} />
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
