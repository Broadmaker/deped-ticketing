import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import NotificationBell from '../ui/NotificationBell.jsx'
import AdminSidebar from './AdminSidebar.jsx'
import { useAuth } from '../../context/useAuth.jsx'
import { useTickets } from '../../context/useTickets.jsx'
import { ROLES } from '../../context/useUsers.jsx'

const PAGE_TITLES = {
  '/admin':          'Dashboard',
  '/admin/tickets':  'All Tickets',
  '/admin/users':    'Users',
  '/admin/offices':  'Offices & Services',
  '/admin/settings': 'Settings',
  '/admin/reports':  'Reports & Analytics',
}

export default function AdminLayout() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const { currentUser } = useAuth()
  const { tickets }     = useTickets()

  const title =
    PAGE_TITLES[pathname] ||
    (pathname.startsWith('/admin/tickets/') ? 'Ticket Detail' : 'Admin')

  const openCount = tickets.filter(t => t.status === 'open').length
  const roleInfo  = ROLES[currentUser?.role]

  return (
    <div className="min-h-screen flex" style={{ background: '#f4f7f5' }}>
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-auto">
        {/* Topbar */}
        <header className="bg-white shadow-sm px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-bold text-gray-800">{title}</h1>
            <p className="text-xs text-gray-400">
              {currentUser?.office} · Division of Zamboanga Sibugay
            </p>
          </div>

          <div className="flex items-center gap-3">
            <NotificationBell />
            {openCount > 0 && (
              <button
                onClick={() => navigate('/admin/tickets')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                style={{ background: '#fef9e7', color: '#d4800c', border: '1px solid #fde68a' }}
              >
                📬 {openCount} Open
              </button>
            )}

            {/* Role badge */}
            {roleInfo && (
              <span
                className="text-xs px-2.5 py-1 rounded-full font-semibold hidden md:inline-block"
                style={{ background: roleInfo.bg, color: roleInfo.color }}
              >
                {roleInfo.label}
              </span>
            )}

            {/* Avatar */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: roleInfo?.color || '#0B4E3D' }}
              >
                {currentUser?.avatar}
              </div>
              <div className="text-sm font-semibold text-gray-700 hidden md:block">
                {currentUser?.name}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}