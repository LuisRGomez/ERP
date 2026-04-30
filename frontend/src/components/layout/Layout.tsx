import { Outlet } from 'react-router-dom'
import AppHeader from './AppHeader'
import NavTabs from './NavTabs'

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      <NavTabs />
      <main className="flex-1 overflow-y-auto px-6 py-5">
        <Outlet />
      </main>
    </div>
  )
}
