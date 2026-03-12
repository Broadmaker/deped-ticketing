// src/pages/admin/AdminTicketDetail.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTickets } from '../../context/useTickets.jsx'
import { useAuth }    from '../../context/useAuth.jsx'
import { useUsers }   from '../../context/useUsers.jsx'
import { useToast }   from '../../components/ui/Toast.jsx'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badges.jsx'
import { formatDate } from '../../lib/utils.js'

const STATUS_OPTIONS   = [
  { value: 'open',        label: '📬 Open',        order: 0 },
  { value: 'in-progress', label: '⚙️  In Progress', order: 1 },
  { value: 'resolved',    label: '✅ Resolved',     order: 2 },
  { value: 'closed',      label: '🔒 Closed',       order: 3 },
]
const STATUS_ORDER = { 'open': 0, 'in-progress': 1, 'resolved': 2, 'closed': 3 }
const PRIORITY_OPTIONS = [
  { value: 'high',   label: '▲ High',   color: '#dc2626' },
  { value: 'medium', label: '◆ Medium', color: '#d97706' },
  { value: 'low',    label: '▼ Low',    color: '#16a34a' },
]

export default function AdminTicketDetail() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const toast       = useToast()
  const { currentUser }  = useAuth()
  const { getTicketDetail, updateStatus, assignTicket, addReply, saveResolution, updatePriority } = useTickets()
  const { getAssignableUsers } = useUsers()

  const [ticket,      setTicket]      = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [replyText,   setReplyText]   = useState('')
  const [resText,     setResText]     = useState('')
  const [resEditing,  setResEditing]  = useState(false)
  const [activeTab,   setActiveTab]   = useState('details')
  const [saving,      setSaving]      = useState(false)

  // Load full ticket detail from API
  async function loadTicket() {
    try {
      const data = await getTicketDetail(id)
      setTicket(data)
      setResText(data.resolution || '')
    } catch {
      toast.error('Ticket not found.')
      navigate('/admin/tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTicket() }, [id])

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400">
        <span className="animate-spin inline-block mr-2">⏳</span> Loading ticket...
      </div>
    )
  }

  if (!ticket) return null

  const assignableUsers = getAssignableUsers(ticket.office_id)

  async function handle(fn, successMsg, errorMsg) {
    setSaving(true)
    try {
      await fn()
      await loadTicket()
      toast.success(successMsg)
    } catch (err) {
      toast.error(err.message || errorMsg)
    } finally {
      setSaving(false)
    }
  }

  function handlePrint() {
    const win = window.open('', '_blank')
    win.document.write(`
      <html><head><title>${ticket.id}</title>
      <style>
        body{font-family:Arial,sans-serif;padding:32px;color:#1a1a1a;font-size:13px}
        h1{font-size:20px;margin-bottom:4px}.meta{color:#666;margin-bottom:24px;font-size:12px}
        table{width:100%;border-collapse:collapse;margin-bottom:20px}
        td{padding:7px 10px;border:1px solid #ddd;vertical-align:top}
        td:first-child{font-weight:bold;background:#f5f5f5;width:160px}
        .section-title{font-weight:bold;font-size:13px;margin:18px 0 6px;color:#0B4E3D;border-bottom:1px solid #0B4E3D;padding-bottom:4px}
        .concern-box{background:#f9f9f9;border:1px solid #ddd;padding:12px;border-radius:4px;line-height:1.6}
        .reply{border-left:3px solid #0B4E3D;padding-left:12px;margin-bottom:10px}
        .reply-meta{font-size:11px;color:#888;margin-bottom:2px}
        .resolution{background:#e8f5f1;border:1px solid #6ee7b7;padding:12px;border-radius:4px}
        .log-entry{font-size:11px;color:#555;padding:4px 0;border-bottom:1px dashed #eee}
      </style></head><body>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <div style="background:#0B4E3D;color:white;padding:6px 14px;border-radius:6px;font-weight:bold;font-size:12px">
          DepEd Division of Zamboanga Sibugay
        </div>
        <div style="color:#999;font-size:11px">Ticket Report · Printed ${new Date().toLocaleString('en-PH')}</div>
      </div>
      <h1>${ticket.subject}</h1>
      <div class="meta">ID: <strong>${ticket.id}</strong> &nbsp;|&nbsp; Status: <strong>${ticket.status}</strong> &nbsp;|&nbsp; Priority: <strong>${ticket.priority}</strong></div>
      <div class="section-title">Ticket Information</div>
      <table>
        <tr><td>Submitted by</td><td>${ticket.submitter_name}</td></tr>
        <tr><td>Email</td><td>${ticket.submitter_email}</td></tr>
        <tr><td>School / Office</td><td>${ticket.submitter_school}</td></tr>
        <tr><td>Service</td><td>${ticket.service_icon || ''} ${ticket.service_label || ticket.service_id}</td></tr>
        <tr><td>Date Submitted</td><td>${formatDate(ticket.created_at)}</td></tr>
        <tr><td>Assigned To</td><td>${ticket.assigned_to_name || 'Unassigned'}</td></tr>
      </table>
      <div class="section-title">Concern</div>
      <div class="concern-box">${ticket.concern}</div>
      ${ticket.resolution ? `<div class="section-title">Resolution</div><div class="resolution">${ticket.resolution}</div>` : ''}
      ${ticket.replies?.length > 0 ? `
        <div class="section-title">Replies (${ticket.replies.length})</div>
        ${ticket.replies.map(r => `<div class="reply"><div class="reply-meta">${r.author_name} · ${formatDate(r.created_at)}</div><div>${r.message}</div></div>`).join('')}
      ` : ''}
      ${ticket.activity_log?.length > 0 ? `
        <div class="section-title">Activity Log</div>
        ${ticket.activity_log.map(e => `<div class="log-entry"><strong>${e.action}</strong> · by ${e.performed_by} · ${formatDate(e.created_at)}</div>`).join('')}
      ` : ''}
      </body></html>`)
    win.document.close()
    win.print()
    toast.info('Print dialog opened.')
  }

  return (
    <div className="p-6 animate-fadeUp space-y-4">

      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => navigate('/admin/tickets')} className="text-sm text-gray-500 hover:text-gray-700">
          ← All Tickets
        </button>
        <button onClick={handlePrint} className="btn-secondary text-xs py-2 px-4">
          🖨️ Print / Export
        </button>
      </div>

      <div className="card overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b border-gray-100" style={{ background: '#f8faf9' }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-gray-400 mb-1">{ticket.id}</div>
              <h2 className="text-xl font-bold text-gray-800">{ticket.subject}</h2>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                <span>👤 {ticket.submitter_name}</span>
                <span>🏫 {ticket.submitter_school}</span>
                <span>📅 {formatDate(ticket.created_at)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge   status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
            </div>
          </div>

          <div className="flex gap-1 mt-5">
            {[{ key: 'details', label: '📋 Details' }, { key: 'activity', label: '🕐 Activity Log' }].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={activeTab === tab.key
                  ? { background: '#0B4E3D', color: 'white' }
                  : { background: 'transparent', color: '#6b7280' }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* ── Details Tab ── */}
          {activeTab === 'details' && (
            <div className="grid md:grid-cols-3 gap-6">

              {/* Left */}
              <div className="md:col-span-2 space-y-6">

                {/* Concern */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Concern</div>
                  <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-xl p-4">{ticket.concern}</p>
                </div>

                {/* Resolution */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Resolution Note</div>
                    <button
                      disabled={saving}
                      onClick={() => {
                        if (resEditing) {
                          handle(
                            () => saveResolution(ticket.id, resText),
                            'Resolution note saved.', 'Failed to save resolution.'
                          )
                        }
                        setResEditing(e => !e)
                      }}
                      className="text-xs font-semibold px-3 py-1 rounded-lg transition-colors"
                      style={resEditing
                        ? { background: '#0B4E3D', color: 'white' }
                        : { background: '#e8f5f1', color: '#0B4E3D' }}>
                      {resEditing ? '💾 Save' : '✏️ Edit'}
                    </button>
                  </div>
                  {resEditing ? (
                    <div className="space-y-2">
                      <textarea className="input-field" rows={3}
                        placeholder="Describe the resolution or steps taken..."
                        value={resText} onChange={e => setResText(e.target.value)} />
                      <button className="text-xs text-gray-400 hover:text-gray-600"
                        onClick={() => { setResEditing(false); setResText(ticket.resolution || '') }}>
                        Cancel
                      </button>
                    </div>
                  ) : ticket.resolution ? (
                    <div className="rounded-xl p-4 text-sm" style={{ background: '#e8f5f1', border: '1px solid #6ee7b7' }}>
                      <div className="font-semibold text-green-800 mb-1 text-xs">✓ Resolved</div>
                      <p className="text-green-800">{ticket.resolution}</p>
                    </div>
                  ) : (
                    <div className="rounded-xl p-4 text-sm text-gray-400 text-center"
                      style={{ background: '#f8faf9', border: '1px dashed #d1d5db' }}>
                      No resolution note yet.{' '}
                      <span className="text-xs" style={{ color: '#0B4E3D' }}>Click Edit to add one.</span>
                    </div>
                  )}
                </div>

                {/* Replies */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                    Replies {ticket.replies?.length > 0 && `(${ticket.replies.length})`}
                  </div>
                  {(!ticket.replies || ticket.replies.length === 0) && (
                    <p className="text-sm text-gray-400 mb-3">No replies yet.</p>
                  )}
                  <div className="space-y-3 mb-4">
                    {ticket.replies?.map(r => (
                      <div key={r.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                          style={{ background: '#0B4E3D' }}>
                          {r.author_name?.[0] || '?'}
                        </div>
                        <div className="flex-1 rounded-xl p-3 text-sm" style={{ background: '#f8faf9' }}>
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <strong className="text-gray-600">{r.author_name}</strong>
                            <span>{formatDate(r.created_at)}</span>
                          </div>
                          <p className="text-gray-700">{r.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Add Reply</div>
                    <textarea className="input-field" rows={3}
                      placeholder="Type a reply, update, or note..."
                      value={replyText} onChange={e => setReplyText(e.target.value)} />
                    <button className="btn-primary mt-2 text-sm"
                      disabled={!replyText.trim() || saving}
                      onClick={() => handle(
                        () => addReply(ticket.id, replyText).then(() => setReplyText('')),
                        'Reply sent.', 'Failed to send reply.'
                      )}>
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Controls */}
              <div className="space-y-4">

                {/* Contact info */}
                <div className="rounded-xl p-4" style={{ background: '#f8faf9' }}>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Contact Info</div>
                  <div className="space-y-2.5 text-sm">
                    {[
                      { label: 'Email',         value: ticket.submitter_email },
                      { label: 'Phone',         value: ticket.submitter_phone || '—' },
                      { label: 'School/Office', value: ticket.submitter_school },
                      { label: 'Service',       value: `${ticket.service_icon || ''} ${ticket.service_label || ticket.service_id}` },
                      { label: 'Office',        value: ticket.office_name },
                    ].map(r => (
                      <div key={r.label}>
                        <div className="text-xs text-gray-400">{r.label}</div>
                        <div className="font-medium break-all">{r.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assign */}
                <div className="rounded-xl p-4" style={{ background: '#f8faf9' }}>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Assign To</div>
                  <select className="input-field text-sm" style={{ padding: '8px 10px' }}
                    value={ticket.assigned_to_id || ''}
                    onChange={e => {
                      const user = assignableUsers.find(u => u.id === e.target.value)
                      handle(
                        () => assignTicket(ticket.id, e.target.value || null),
                        user ? `Assigned to ${user.name}.` : 'Ticket unassigned.',
                        'Failed to assign ticket.'
                      )
                    }}>
                    <option value="">— Unassigned —</option>
                    {assignableUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  {ticket.assigned_to_name && (
                    <div className="mt-2 text-xs text-gray-500">
                      Currently: <strong>{ticket.assigned_to_name}</strong>
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div className="rounded-xl p-4" style={{ background: '#f8faf9' }}>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Priority</div>
                  <div className="space-y-1.5">
                    {PRIORITY_OPTIONS.map(opt => (
                      <button key={opt.value} disabled={saving}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: ticket.priority === opt.value ? opt.color : 'transparent',
                          color:      ticket.priority === opt.value ? 'white'   : '#4b5563',
                          border:     `1px solid ${ticket.priority === opt.value ? opt.color : '#e5e7eb'}`,
                        }}
                        onClick={() => handle(
                          () => updatePriority(ticket.id, opt.value),
                          `Priority set to ${opt.value}.`, 'Failed to update priority.'
                        )}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div className="rounded-xl p-4" style={{ background: '#f8faf9' }}>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Update Status</div>
                  <div className="space-y-1.5">
                    {STATUS_OPTIONS.map((opt, i) => {
                      const currentOrder = STATUS_ORDER[ticket.status] ?? 0
                      const isCurrent  = ticket.status === opt.value
                      const isDone     = opt.order < currentOrder
                      const isNext     = opt.order === currentOrder + 1
                      const isDisabled = saving || isCurrent || isDone || opt.order > currentOrder + 1
                      return (
                        <button key={opt.value}
                          disabled={isDisabled}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-between"
                          style={{
                            background: isCurrent ? '#0B4E3D' : isDone ? '#f0fdf4' : 'transparent',
                            color:      isCurrent ? 'white' : isDone ? '#16a34a' : isNext ? '#0B4E3D' : '#9ca3af',
                            border:     `1px solid ${isCurrent ? '#0B4E3D' : isDone ? '#bbf7d0' : isNext ? '#0B4E3D' : '#e5e7eb'}`,
                            cursor:     isDisabled ? 'not-allowed' : 'pointer',
                            opacity:    !isCurrent && !isDone && !isNext ? 0.45 : 1,
                          }}
                          onClick={() => !isDisabled && handle(
                            () => updateStatus(ticket.id, opt.value),
                            `Status updated to "${opt.label.replace(/^[^\s]+\s/, '')}".`,
                            'Failed to update status.'
                          )}>
                          <span>{opt.label}</span>
                          {isDone  && <span style={{ fontSize: 10 }}>✓ Done</span>}
                          {isCurrent && <span style={{ fontSize: 10 }}>● Current</span>}
                          {isNext  && <span style={{ fontSize: 10 }}>→ Next</span>}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Status moves forward only</p>
                </div>

                {/* Timestamps */}
                <div className="rounded-xl p-4 text-xs text-gray-400 space-y-1" style={{ background: '#f8faf9' }}>
                  <div>Created: {formatDate(ticket.created_at)}</div>
                  <div>Updated: {formatDate(ticket.updated_at)}</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Activity Log Tab ── */}
          {activeTab === 'activity' && (
            <div className="max-w-2xl animate-fadeUp">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                Full Activity Log — {ticket.activity_log?.length || 0} events
              </div>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{ background: '#e5e7eb' }} />
                <div className="space-y-1">
                  {[...(ticket.activity_log || [])].reverse().map((entry, i) => (
                    <div key={entry.id} className="relative flex items-start gap-4 py-3 pl-10">
                      <div className="absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 border-white flex-shrink-0"
                        style={{ background: i === 0 ? '#0B4E3D' : '#d1d5db' }} />
                      <div>
                        <div className="text-sm font-semibold text-gray-700">{entry.action}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          by <strong>{entry.performed_by}</strong> · {formatDate(entry.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}