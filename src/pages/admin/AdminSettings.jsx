import { useState } from 'react'
import { useAuth }  from '../../context/useAuth.jsx'
import { useToast } from '../../components/ui/Toast.jsx'
import { useNavigate } from 'react-router-dom'

export default function AdminSettings() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    divisionName:  'Division of Zamboanga Sibugay',
    systemName:    'DepEd Helpdesk & Ticketing System',
    adminEmail:    'ict@deped-zamsib.gov.ph',
    supportHours:  'Mon–Fri, 8:00 AM – 5:00 PM',
    ticketPrefix:  'TKT',
    autoClose:     '30',
  })

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function handleSave(e) {
    e.preventDefault()
    setSaved(true)
    toast.success('Settings saved successfully.')
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="p-6 animate-fadeUp max-w-2xl space-y-6">

      {/* System Settings */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-800 mb-1 text-base flex items-center gap-2">
          ⚙️ System Settings
        </h2>
        <p className="text-xs text-gray-400 mb-5">
          General configuration for the ticketing system.
        </p>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Division Name</label>
              <input className="input-field" value={form.divisionName} onChange={set('divisionName')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">System Name</label>
              <input className="input-field" value={form.systemName} onChange={set('systemName')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Admin Email</label>
              <input className="input-field" type="email" value={form.adminEmail} onChange={set('adminEmail')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Support Hours</label>
              <input className="input-field" value={form.supportHours} onChange={set('supportHours')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Ticket ID Prefix</label>
              <input className="input-field" value={form.ticketPrefix} onChange={set('ticketPrefix')} />
              <p className="text-xs text-gray-400 mt-1">e.g. TKT → TKT-2025-0001</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">
                Auto-close Resolved Tickets (days)
              </label>
              <input className="input-field" type="number" min="1" value={form.autoClose} onChange={set('autoClose')} />
              <p className="text-xs text-gray-400 mt-1">Resolved tickets close automatically after this many days.</p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button type="submit" className="btn-primary">Save Changes</button>
            {saved && (
              <span className="text-sm font-semibold animate-fadeUp" style={{ color: '#16a34a' }}>
                ✓ Saved!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Quick links */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-800 mb-1 text-base flex items-center gap-2">
          🔗 Quick Links
        </h2>
        <p className="text-xs text-gray-400 mb-4">Jump to other management areas.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { icon: '🏢', label: 'Offices & Services',  desc: 'Add, edit, and activate offices',  path: '/admin/offices'  },
            { icon: '🎫', label: 'All Tickets',          desc: 'View and manage all tickets',      path: '/admin/tickets'  },
            { icon: '📊', label: 'Dashboard',            desc: 'Overview and stats',               path: '/admin'          },
            { icon: '🌐', label: 'Public Portal',        desc: 'View as a public user',            path: '/'               },
          ].map(link => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="flex items-center gap-3 p-4 rounded-xl text-left transition-colors hover:bg-gray-50"
              style={{ border: '1px solid #e5e7eb' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: '#e8f5f1' }}
              >
                {link.icon}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">{link.label}</div>
                <div className="text-xs text-gray-400">{link.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Future features */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-800 mb-1 text-base flex items-center gap-2">
          🚀 Upcoming Features
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          These features are planned and will be available once the backend is connected.
        </p>
        <div className="space-y-2.5">
          {[
            { icon: '📧', label: 'Email Notifications',       desc: 'Auto-notify submitters on status changes' },
            { icon: '👤', label: 'Staff Accounts',            desc: 'Multiple staff logins with individual access' },
            { icon: '📈', label: 'Reports & Analytics',       desc: 'Monthly ticket summaries and SLA tracking' },
            { icon: '🔔', label: 'In-app Notifications',      desc: 'Real-time alerts for new and updated tickets' },
            { icon: '📎', label: 'File Attachments',          desc: 'Allow submitters to attach screenshots or docs' },
            { icon: '⏱️',  label: 'SLA / Response Timers',    desc: 'Track response and resolution time per ticket' },
            { icon: '💬', label: 'Two-way Email Reply',       desc: 'Reply to tickets directly via email' },
            { icon: '🗃️', label: 'Ticket Categories & Tags',  desc: 'Custom labels for better filtering' },
          ].map(f => (
            <div
              key={f.label}
              className="flex items-center gap-3 px-4 py-3 rounded-xl"
              style={{ background: '#f8faf9', border: '1px solid #e5e7eb' }}
            >
              <div className="text-xl w-7 text-center flex-shrink-0">{f.icon}</div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-700">{f.label}</div>
                <div className="text-xs text-gray-400">{f.desc}</div>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                style={{ background: '#fef3c7', color: '#92400e' }}
              >
                Planned
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Current session */}
      <div className="card p-6">
        <h2 className="font-bold text-gray-800 mb-4 text-base">🔐 Current Session</h2>
        <div className="space-y-0 divide-y divide-gray-100 text-sm">
          {[
            { label: 'Logged in as', value: currentUser?.name },
            { label: 'Username',     value: currentUser?.username },
            { label: 'Role',         value: currentUser?.role },
            { label: 'Office',       value: currentUser?.office },
          ].map(row => (
            <div key={row.label} className="flex justify-between py-2.5">
              <span className="text-gray-500">{row.label}</span>
              <span className="font-semibold capitalize">{row.value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}