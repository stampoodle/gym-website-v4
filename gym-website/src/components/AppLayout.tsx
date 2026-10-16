import { Outlet } from 'react-router-dom'
import SideNav from './SideNav'
import BottomNav from './BottomNav'

export default function AppLayout() {
  return (
    <div className="app-shell">
      <SideNav />
      <div className="app-shell__content">
        <main className="app-main">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  )
}
