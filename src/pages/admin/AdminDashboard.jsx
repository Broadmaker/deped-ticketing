import { useNavigate } from 'react-router-dom'
import { useTickets } from '../../context/useTickets.jsx'
import { useState, useEffect } from 'react'
import { useAuth } from '../../context/useAuth.jsx'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badges.jsx'
import { formatDateShort } from '../../lib/utils.js'
import { useOffices } from '../../context/useOffices.jsx'
import { useUsers } from '../../context/useUsers.jsx'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { tickets, getStats } = useTickets()
  const { currentUser } = useAuth()
  const { users } = useUsers()

  const [apiStats, setApiStats] = useState(null)

  useEffect(() => {
    getStats().then(setApiStats).catch(() => {})
  }, [tickets]) // refresh when tickets change

  // Derive from local tickets list (fast, no extra fetch)
  const stats = {
    total:      tickets.length,
    open:       tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved:   tickets.filter(t => t.status === 'resolved').length,
    closed:     tickets.filter(t => t.status === 'closed').length,
    unassigned: tickets.filter(t => t.status === 'open' && !t.assigned_to_id).length,
  }

  const urgentTickets = tickets
    .filter(t => t.priority === 'high' && t.status !== 'closed' && t.status !== 'resolved')

  const recentTickets = apiStats?.recent || [...tickets]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

  const staffList = users.filter(u => {
    if (u.role !== 'staff' && u.role !== 'office_admin') return false
    // Office admins only see staff from their own office
    if (currentUser?.role !== 'superadmin' && u.office_id !== currentUser?.office_id) return false
    return true
  })
  const staffWorkload = staffList.map(s => ({
    ...s,
    assigned: tickets.filter(t => t.assigned_to_id === s.id).length,
    active:   tickets.filter(t => t.assigned_to_id === s.id && ['open','in-progress'].includes(t.status)).length,
  }))

  const serviceBreakdown = apiStats?.by_service || []

  return (
    <div className="p-6 space-y-6 animate-fadeUp">

      {/* Welcome bar */}
      <div
        className="rounded-2xl p-5 flex items-center justify-between flex-wrap gap-4 hero-pattern"
        style={{ background: '#0B4E3D' }}
      >
        <div>
          <div className="text-white font-bold text-lg">
            Welcome back, {currentUser?.name?.split(' ')[0]}! 👋
          </div>
          <div className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {stats.open > 0
              ? `You have ${stats.open} open ticket${stats.open > 1 ? 's' : ''} waiting for action.`
              : 'All tickets are up to date. Great work!'}
          </div>
        </div>
        <button
          className="btn-gold text-sm"
          onClick={() => navigate('/admin/tickets')}
        >
          View All Tickets →
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total',       val: stats.total,      icon: '🎫', bg: '#e8f5f1', col: '#0B4E3D' },
          { label: 'Open',        val: stats.open,       icon: '📬', bg: '#fef9e7', col: '#d4800c' },
          { label: 'In Progress', val: stats.inProgress, icon: '⚙️', bg: '#e8f4fd', col: '#1d6fa4' },
          { label: 'Resolved',    val: stats.resolved,   icon: '✅', bg: '#e8f5f1', col: '#16a34a' },
          { label: 'Unassigned',  val: stats.unassigned, icon: '⚠️', bg: '#fef2f2', col: '#dc2626' },
        ].map(s => (
          <div
            key={s.label}
            className="card card-hover p-4 cursor-pointer"
            onClick={() => navigate('/admin/tickets')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg" style={{ background: s.bg }}>
                {s.icon}
              </div>
              <div className="text-2xl font-bold" style={{ color: s.col }}>{s.val}</div>
            </div>
            <div className="text-xs font-semibold text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* Recent tickets */}
        <div className="md:col-span-2 card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="font-bold text-gray-800">Recent Tickets</div>
            <button className="text-xs font-semibold" style={{ color: '#0B4E3D' }}
              onClick={() => navigate('/admin/tickets')}>View All →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#f8faf9' }}>
                  {['ID', 'Subject', 'From', 'Status', 'Priority', 'Date'].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentTickets.map(t => (
                  <tr
                    key={t.id}
                    className="hover:bg-forest-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/admin/tickets/${t.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{t.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      <div className="truncate max-w-[160px]">{t.subject}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{t.submitter_name}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{formatDateShort(t.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Urgent tickets */}
          <div className="card p-5">
            <div className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
              ⚠️ High Priority
              {urgentTickets.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  {urgentTickets.length}
                </span>
              )}
            </div>
            {urgentTickets.length === 0 ? (
              <p className="text-sm text-gray-400">No urgent tickets. ✓</p>
            ) : (
              <div className="space-y-2">
                {urgentTickets.map(t => (
                  <div
                    key={t.id}
                    className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50"
                    style={{ border: '1px solid #fecaca' }}
                    onClick={() => navigate(`/admin/tickets/${t.id}`)}
                  >
                    <div className="text-xs font-mono text-gray-400 mb-0.5">{t.id}</div>
                    <div className="text-sm font-semibold text-gray-700 truncate">{t.subject}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{t.submitter_school}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Staff workload */}
          <div className="card p-5">
            <div className="font-bold text-gray-800 text-sm mb-3">👥 Staff Workload</div>
            <div className="space-y-3">
              {staffWorkload.map(s => (
                <div key={s.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: '#1d6fa4' }}
                  >
                    {s.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-700 truncate">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.active} active · {s.assigned} total</div>
                  </div>
                  <div
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: s.active > 2 ? '#fef2f2' : s.active > 0 ? '#e8f4fd' : '#f3f4f6',
                      color:      s.active > 2 ? '#dc2626' : s.active > 0 ? '#1d6fa4' : '#9ca3af',
                    }}
                  >
                    {s.active}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Service breakdown */}
      {serviceBreakdown.length > 0 && (
        <div className="card p-6">
          <div className="font-bold text-gray-800 mb-4">Tickets by Service</div>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
            {serviceBreakdown.map(svc => {
              const total = serviceBreakdown.reduce((s, x) => s + Number(x.count), 0)
              const pct   = total ? Math.round((Number(svc.count) / total) * 100) : 0
              return (
                <div key={svc.label} className="flex items-center gap-3">
                  <div className="text-base w-6 flex-shrink-0">{svc.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700 truncate">{svc.label}</span>
                      <span className="text-gray-400 ml-2">{svc.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#e8f5f1' }}>
                      <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: '#0B4E3D' }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}