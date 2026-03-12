import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.jsx'
import { ROLES } from '../../context/useUsers.jsx'

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard',          icon: '📊', path: '/admin',          permission: null },
  { id: 'tickets',   label: 'All Tickets',         icon: '🎫', path: '/admin/tickets',  permission: null },
  { id: 'offices',   label: 'Offices & Services',  icon: '🏢', path: '/admin/offices',  permission: 'manage_offices' },
  { id: 'users',     label: 'Users',               icon: '👥', path: '/admin/users',    permission: 'manage_users' },
  { id: 'reports',   label: 'Reports',              icon: '📈', path: '/admin/reports',  permission: 'view_dashboard' },
  { id: 'csm',       label: 'CSM Survey',           icon: '📋', path: '/admin/csm',      permission: 'view_dashboard' },
  { id: 'settings',  label: 'Settings',            icon: '⚙️', path: '/admin/settings', permission: 'access_settings' },
]

export default function AdminSidebar() {
  const navigate      = useNavigate()
  const { pathname }  = useLocation()
  const { currentUser, logout, can } = useAuth()

  const role = ROLES[currentUser?.role]

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  const visibleItems = MENU_ITEMS.filter(item =>
    !item.permission || can(item.permission)
  )

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col shadow-xl"
      style={{ background: '#0B4E3D', minHeight: '100vh' }}
    >
      {/* Logo */}
      <div className="p-5 pb-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
            style={{ background: '#FFC107' }}>
            🎓
          </div>
          <div>
            <div className="text-white text-sm font-bold leading-tight">DepEd ZamSib</div>
            <div className="text-xs font-bold uppercase tracking-widest" style={{ color: '#FFC107' }}>
              Admin Panel
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 flex-1 space-y-0.5">
        {visibleItems.map(item => {
          const isActive = item.path === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.path)
          return (
            <div
              key={item.id}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          )
        })}

        <div className="pt-3 mt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="sidebar-item" onClick={() => navigate('/')}>
            <span>🌐</span>
            <span>Public Portal</span>
          </div>
        </div>
      </nav>

      {/* User info + logout */}
      <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3 mb-3 px-1">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: role?.color || '#FFC107', color: 'white' }}
          >
            {currentUser?.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{currentUser?.name}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {role?.label || 'User'} · {currentUser?.office}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full sidebar-item justify-center text-xs gap-2"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <span>🚪</span> Sign Out
        </button>
      </div>
    </aside>
  )
}