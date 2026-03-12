// src/components/ui/NotificationBell.jsx
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { useAuth } from '../../context/useAuth.jsx'

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationBell() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const [notifs,  setNotifs]  = useState([])
  const [open,    setOpen]    = useState(false)
  const ref = useRef(null)

  const unread = notifs.filter(n => !n.is_read).length

  async function fetchNotifs() {
    try {
      const data = await api.get('/notifications')
      setNotifs(data)
    } catch (_) {}
  }

  // Poll every 30 seconds
  useEffect(() => {
    if (!currentUser) return
    fetchNotifs()
    const interval = setInterval(fetchNotifs, 30000)
    return () => clearInterval(interval)
  }, [currentUser])

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleMarkRead(id) {
    await api.patch(`/notifications/${id}/read`)
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function handleMarkAll() {
    await api.patch('/notifications/read-all')
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  function handleClick(notif) {
    handleMarkRead(notif.id)
    if (notif.ticket_id) navigate(`/admin/tickets/${notif.ticket_id}`)
    setOpen(false)
  }

  const TYPE_ICON = { assignment: '📋', unassignment: '↩️', reply: '💬', status: '🔄' }

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) fetchNotifs() }}
        className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
        style={{ background: open ? 'rgba(255,255,255,0.15)' : 'transparent' }}
        title="Notifications"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: '#ef4444', fontSize: 9 }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-11 w-80 rounded-2xl shadow-2xl overflow-hidden z-50 animate-fadeUp"
          style={{ background: 'white', border: '1px solid #e5e7eb' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="font-bold text-gray-800 text-sm">
              Notifications
              {unread > 0 && (
                <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: '#fef2f2', color: '#ef4444' }}>
                  {unread} new
                </span>
              )}
            </div>
            {unread > 0 && (
              <button onClick={handleMarkAll}
                className="text-xs font-semibold transition-colors"
                style={{ color: '#0B4E3D' }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
            {notifs.length === 0 ? (
              <div className="py-10 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <div className="text-sm text-gray-400">No notifications yet.</div>
              </div>
            ) : (
              notifs.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors hover:bg-gray-50"
                  style={{ background: n.is_read ? 'white' : '#f0fdf4' }}
                >
                  <div className="text-lg flex-shrink-0 mt-0.5">
                    {TYPE_ICON[n.type] || '🔔'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-relaxed">{n.message}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">{timeAgo(n.created_at)}</span>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ background: '#0B4E3D' }} />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}