// src/pages/admin/AdminReports.jsx
import { useState, useEffect, useCallback } from 'react'
import { useAuth }   from '../../context/useAuth.jsx'
import { api }       from '../../lib/api.js'
import { useToast }  from '../../components/ui/Toast.jsx'

// ── Constants ─────────────────────────────────────────────────────────────────

const RANGE_OPTIONS = [
  { value: '7d',     label: 'Last 7 days' },
  { value: '30d',    label: 'Last 30 days' },
  { value: '90d',    label: 'Last 90 days' },
  { value: 'custom', label: 'Custom range' },
]

const STATUS_CFG = {
  open:         { label: 'Open',        color: '#3b82f6', bg: '#eff6ff' },
  'in-progress':{ label: 'In Progress', color: '#f59e0b', bg: '#fffbeb' },
  resolved:     { label: 'Resolved',    color: '#10b981', bg: '#ecfdf5' },
  closed:       { label: 'Closed',      color: '#6b7280', bg: '#f3f4f6' },
}

const PRIORITY_CFG = {
  high:   { label: 'High',   color: '#ef4444', bg: '#fef2f2' },
  medium: { label: 'Medium', color: '#f59e0b', bg: '#fffbeb' },
  low:    { label: 'Low',    color: '#10b981', bg: '#ecfdf5' },
}

const DAY_LABELS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const HOUR_LABELS  = Array.from({length:24},(_,i)=> i===0?'12am': i<12?`${i}am`: i===12?'12pm':`${i-12}pm`)

// ── Helpers ───────────────────────────────────────────────────────────────────

function pct(val, total) {
  return total ? Math.round((Number(val) / Number(total)) * 100) : 0
}

function fmtHours(h) {
  if (!h || h <= 0) return '—'
  const hrs = Number(h)
  if (hrs < 1)  return `${Math.round(hrs * 60)}m`
  if (hrs < 24) return `${hrs.toFixed(1)}h`
  return `${(hrs / 24).toFixed(1)}d`
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-PH', { month:'short', day:'numeric', year:'numeric' })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = '#0B4E3D', icon }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      {icon && (
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: color + '18' }}>
          {icon}
        </div>
      )}
      <div>
        <div className="text-2xl font-bold" style={{ color }}>{value ?? '—'}</div>
        <div className="text-xs font-semibold text-gray-500 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="text-sm font-bold text-gray-700">{children}</div>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

function HBar({ label, icon, count, total, color = '#0B4E3D', sub }) {
  const width = pct(count, total)
  return (
    <div className="flex items-center gap-3 py-1.5">
      {icon && <span className="text-base w-6 flex-shrink-0">{icon}</span>}
      <div className="w-28 flex-shrink-0 text-xs font-medium text-gray-600 truncate">{label}</div>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#f3f4f6' }}>
        <div className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${width}%`, background: color }} />
      </div>
      <div className="w-8 text-right text-xs font-bold text-gray-700">{count}</div>
      {sub && <div className="w-10 text-right text-xs text-gray-400">{sub}</div>}
    </div>
  )
}

// ── Heatmap ───────────────────────────────────────────────────────────────────

function HeatmapHours({ data }) {
  const max = Math.max(...data.map(d => Number(d.count)), 1)
  // Fill all 24 hours
  const filled = HOUR_LABELS.map((label, i) => {
    const found = data.find(d => Number(d.hour) === i)
    return { hour: i, label, count: found ? Number(found.count) : 0 }
  })
  return (
    <div>
      <div className="flex gap-1 flex-wrap">
        {filled.map(({ hour, label, count }) => {
          const intensity = count / max
          const bg = count === 0 ? '#f3f4f6'
            : `rgba(11,78,61,${0.12 + intensity * 0.88})`
          const fg = intensity > 0.5 ? 'white' : '#0B4E3D'
          return (
            <div key={hour} title={`${label}: ${count} tickets`}
              className="flex flex-col items-center justify-center rounded-lg cursor-default transition-all"
              style={{ width: 44, height: 44, background: bg }}>
              <div className="text-xs font-bold" style={{ color: fg, fontSize: 11 }}>{count || ''}</div>
              <div className="text-xs" style={{ color: fg, opacity: 0.75, fontSize: 9 }}>{label}</div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-xs text-gray-400">Less</span>
        {[0.05,0.25,0.5,0.75,1].map(v => (
          <div key={v} className="w-4 h-4 rounded" style={{ background: `rgba(11,78,61,${v})` }} />
        ))}
        <span className="text-xs text-gray-400">More</span>
      </div>
    </div>
  )
}

function HeatmapDays({ data }) {
  const max = Math.max(...data.map(d => Number(d.count)), 1)
  const filled = DAY_LABELS.map((label, i) => {
    const found = data.find(d => Number(d.dow) === i)
    return { dow: i, label, count: found ? Number(found.count) : 0 }
  })
  return (
    <div className="flex gap-2">
      {filled.map(({ dow, label, count }) => {
        const intensity = count / max
        const bg = count === 0 ? '#f3f4f6' : `rgba(11,78,61,${0.12 + intensity * 0.88})`
        const fg = intensity > 0.5 ? 'white' : '#0B4E3D'
        return (
          <div key={dow} title={`${label}: ${count} tickets`}
            className="flex-1 flex flex-col items-center justify-center rounded-xl py-3 cursor-default"
            style={{ background: bg, minHeight: 64 }}>
            <div className="text-sm font-bold" style={{ color: fg }}>{count || '0'}</div>
            <div className="text-xs mt-0.5" style={{ color: fg, opacity: 0.75 }}>{label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Staff Table ───────────────────────────────────────────────────────────────

function StaffTable({ staff, totals }) {
  if (!staff?.length) return <p className="text-sm text-gray-400">No staff data available.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {['Staff Member','Office','Assigned','Active','Resolved','Avg. Resolution'].map(h => (
              <th key={h} className="text-left text-xs font-bold text-gray-400 py-2 pr-4 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {staff.map((s, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ background: '#0B4E3D', fontSize: 10 }}>
                    {s.avatar || s.name?.[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-xs">{s.name}</div>
                    <div className="text-xs text-gray-400 capitalize">{(s.role || '').replace('_',' ')}</div>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4 text-xs text-gray-500">{s.office || '—'}</td>
              <td className="py-3 pr-4">
                <span className="font-bold text-gray-800">{s.total_assigned}</span>
              </td>
              <td className="py-3 pr-4">
                <span className="text-amber-600 font-semibold">{s.active}</span>
              </td>
              <td className="py-3 pr-4">
                <span className="text-green-600 font-semibold">{s.resolved}</span>
              </td>
              <td className="py-3">
                <span className="font-mono text-xs text-gray-600">{fmtHours(s.avg_resolution_hrs)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Print view ────────────────────────────────────────────────────────────────

function printReport(data, range) {
  const { totals, by_status, by_priority, by_service, resolution, staff } = data
  const win = window.open('', '_blank')
  const total = Number(totals.total)

  win.document.write(`<!DOCTYPE html><html><head>
  <title>DepEd ZamSib — Ticketing Report</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #1a1a1a; font-size: 13px; }
    h1   { font-size: 22px; color: #0B4E3D; margin-bottom: 2px; }
    h2   { font-size: 14px; color: #0B4E3D; border-bottom: 2px solid #0B4E3D; padding-bottom: 4px; margin: 24px 0 10px; }
    .meta { color: #888; font-size: 11px; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 24px; }
    .stat { background: #f8faf9; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    .stat-val { font-size: 28px; font-weight: bold; color: #0B4E3D; }
    .stat-lbl { font-size: 11px; color: #888; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; }
    th    { text-align: left; font-size: 11px; color: #888; text-transform: uppercase; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
    td    { padding: 7px 8px; border-bottom: 1px solid #f3f4f6; font-size: 12px; }
    .bar  { height: 8px; background: #0B4E3D; border-radius: 4px; display: inline-block; }
    .footer { margin-top: 32px; font-size: 10px; color: #aaa; border-top: 1px solid #e5e7eb; padding-top: 12px; }
  </style></head><body>
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
    <div style="background:#0B4E3D;color:#FFC107;padding:8px 16px;border-radius:8px;font-weight:bold;font-size:13px;">
      DepEd Division of Zamboanga Sibugay
    </div>
    <div style="color:#888;font-size:11px;">Helpdesk & Ticketing System</div>
  </div>
  <h1>Ticket Analytics Report</h1>
  <div class="meta">
    Period: <strong>${fmtDate(range.from)}</strong> — <strong>${fmtDate(range.to)}</strong>
    &nbsp;|&nbsp; Generated: ${new Date().toLocaleString('en-PH')}
  </div>

  <div class="grid">
    <div class="stat"><div class="stat-val">${totals.total}</div><div class="stat-lbl">Total Tickets</div></div>
    <div class="stat"><div class="stat-val">${totals.open}</div><div class="stat-lbl">Open</div></div>
    <div class="stat"><div class="stat-val">${totals.in_progress}</div><div class="stat-lbl">In Progress</div></div>
    <div class="stat"><div class="stat-val">${totals.resolved}</div><div class="stat-lbl">Resolved</div></div>
    <div class="stat"><div class="stat-val">${totals.closed}</div><div class="stat-lbl">Closed</div></div>
    <div class="stat"><div class="stat-val">${fmtHours(resolution?.avg_hours)}</div><div class="stat-lbl">Avg. Resolution Time</div></div>
  </div>

  <h2>By Status</h2>
  <table><tr><th>Status</th><th>Count</th><th>Share</th><th style="width:200px">Bar</th></tr>
  ${by_status.map(r=>`<tr>
    <td>${r.status}</td><td><strong>${r.count}</strong></td>
    <td>${pct(r.count,total)}%</td>
    <td><span class="bar" style="width:${pct(r.count,total)*1.8}px"></span></td>
  </tr>`).join('')}</table>

  <h2>By Priority</h2>
  <table><tr><th>Priority</th><th>Count</th><th>Share</th><th style="width:200px">Bar</th></tr>
  ${by_priority.map(r=>`<tr>
    <td>${r.priority}</td><td><strong>${r.count}</strong></td>
    <td>${pct(r.count,total)}%</td>
    <td><span class="bar" style="width:${pct(r.count,total)*1.8}px"></span></td>
  </tr>`).join('')}</table>

  <h2>Top Services</h2>
  <table><tr><th>Service</th><th>Office</th><th>Count</th></tr>
  ${by_service.map(r=>`<tr><td>${r.icon||''} ${r.service}</td><td>${r.office}</td><td><strong>${r.count}</strong></td></tr>`).join('')}</table>

  <h2>Staff Performance</h2>
  <table><tr><th>Name</th><th>Role</th><th>Office</th><th>Assigned</th><th>Active</th><th>Resolved</th><th>Avg. Resolution</th></tr>
  ${staff.map(s=>`<tr>
    <td>${s.name}</td><td>${s.role.replace('_',' ')}</td><td>${s.office||'—'}</td>
    <td>${s.total_assigned}</td><td>${s.active}</td><td>${s.resolved}</td>
    <td>${fmtHours(s.avg_resolution_hrs)}</td>
  </tr>`).join('')}</table>

  <div class="footer">
    DepEd Division of Zamboanga Sibugay · ICT Office · Helpdesk & Ticketing System<br>
    This report was automatically generated. Data is accurate as of ${new Date().toLocaleString('en-PH')}.
  </div>
  </body></html>`)
  win.document.close()
  win.print()
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminReports() {
  const { currentUser } = useAuth()
  const toast = useToast()

  const [range,    setRange]    = useState('30d')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo,   setDateTo]   = useState('')
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(false)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ range })
      if (range === 'custom' && dateFrom && dateTo) {
        params.set('date_from', dateFrom)
        params.set('date_to',   dateTo)
      }
      const res = await api.get(`/reports/summary?${params}`)
      setData(res)
    } catch (err) {
      toast.error(err.message || 'Failed to load report.')
    } finally {
      setLoading(false)
    }
  }, [range, dateFrom, dateTo])

  useEffect(() => { fetchReport() }, [fetchReport])

  const totals = data?.totals
  const total  = Number(totals?.total || 0)

  return (
    <div className="p-6 space-y-6 animate-fadeUp">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {data ? `${fmtDate(data.range.from)} — ${fmtDate(data.range.to)}` : 'Loading...'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Range selector */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 text-xs font-semibold">
            {RANGE_OPTIONS.map(opt => (
              <button key={opt.value}
                onClick={() => setRange(opt.value)}
                className="px-3 py-2 transition-colors"
                style={range === opt.value
                  ? { background: '#0B4E3D', color: 'white' }
                  : { background: 'white', color: '#6b7280' }}>
                {opt.label}
              </button>
            ))}
          </div>

          {/* Custom date pickers */}
          {range === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" className="input-field text-xs py-1.5 px-2"
                value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                style={{ width: 140 }} />
              <span className="text-gray-400 text-xs">to</span>
              <input type="date" className="input-field text-xs py-1.5 px-2"
                value={dateTo} onChange={e => setDateTo(e.target.value)}
                style={{ width: 140 }} />
              <button className="btn-primary text-xs py-1.5 px-3" onClick={fetchReport}>Apply</button>
            </div>
          )}

          <button
            disabled={!data || loading}
            onClick={() => data && printReport(data, data.range)}
            className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5">
            🖨️ Export / Print
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <span className="animate-spin mr-2">⏳</span> Loading report...
        </div>
      )}

      {!loading && data && (
        <>
          {/* ── KPI Cards ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Tickets"  value={totals.total}       icon="🎫" color="#0B4E3D" />
            <StatCard label="Open"           value={totals.open}        icon="📬" color="#3b82f6" />
            <StatCard label="In Progress"    value={totals.in_progress} icon="⚙️"  color="#f59e0b" />
            <StatCard label="Resolved"       value={totals.resolved}    icon="✅" color="#10b981" />
            <StatCard label="Closed"         value={totals.closed}      icon="🔒" color="#6b7280" />
            <StatCard label="Unassigned"     value={totals.unassigned}  icon="⚠️"  color="#ef4444"
              sub={totals.unassigned > 0 ? 'Need attention' : 'All assigned'} />
          </div>

          {/* ── Resolution time ─────────────────────────────────────────── */}
          {Number(data.resolution?.resolved_count) > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <StatCard label="Avg. Resolution Time" icon="⏱️" color="#7c3aed"
                value={fmtHours(data.resolution.avg_hours)}
                sub={`${data.resolution.resolved_count} tickets resolved`} />
              <StatCard label="Fastest Resolution" icon="⚡" color="#0891b2"
                value={fmtHours(data.resolution.min_hours)} />
              <StatCard label="Longest Resolution" icon="🐢" color="#dc2626"
                value={fmtHours(data.resolution.max_hours)} />
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">

            {/* ── By Status ───────────────────────────────────────────────── */}
            <div className="card p-5">
              <SectionTitle>Tickets by Status</SectionTitle>
              <div className="space-y-1">
                {data.by_status.map(r => (
                  <HBar key={r.status}
                    label={STATUS_CFG[r.status]?.label || r.status}
                    count={Number(r.count)} total={total}
                    color={STATUS_CFG[r.status]?.color || '#0B4E3D'}
                    sub={`${pct(r.count, total)}%`} />
                ))}
                {data.by_status.length === 0 && <p className="text-sm text-gray-400">No data.</p>}
              </div>
            </div>

            {/* ── By Priority ─────────────────────────────────────────────── */}
            <div className="card p-5">
              <SectionTitle>Tickets by Priority</SectionTitle>
              <div className="space-y-1">
                {data.by_priority.map(r => (
                  <HBar key={r.priority}
                    label={PRIORITY_CFG[r.priority]?.label || r.priority}
                    count={Number(r.count)} total={total}
                    color={PRIORITY_CFG[r.priority]?.color || '#0B4E3D'}
                    sub={`${pct(r.count, total)}%`} />
                ))}
                {data.by_priority.length === 0 && <p className="text-sm text-gray-400">No data.</p>}
              </div>
            </div>

            {/* ── By Office ───────────────────────────────────────────────── */}
            {data.by_office.length > 1 && (
              <div className="card p-5">
                <SectionTitle>Tickets by Office</SectionTitle>
                <div className="space-y-1">
                  {data.by_office.map(r => (
                    <HBar key={r.office} icon={r.icon} label={r.office}
                      count={Number(r.count)} total={total}
                      sub={`${pct(r.count, total)}%`} />
                  ))}
                </div>
              </div>
            )}

            {/* ── By Service ──────────────────────────────────────────────── */}
            <div className="card p-5">
              <SectionTitle>Top Services</SectionTitle>
              <div className="space-y-1">
                {data.by_service.map(r => (
                  <HBar key={r.service + r.office} icon={r.icon} label={r.service}
                    count={Number(r.count)} total={total}
                    sub={`${pct(r.count, total)}%`} />
                ))}
                {data.by_service.length === 0 && <p className="text-sm text-gray-400">No data.</p>}
              </div>
            </div>
          </div>

          {/* ── Peak Hours Heatmap ───────────────────────────────────────── */}
          <div className="card p-5">
            <SectionTitle>Peak Submission Hours (Philippine Time)</SectionTitle>
            {data.peak_hours.length > 0
              ? <HeatmapHours data={data.peak_hours} />
              : <p className="text-sm text-gray-400">No data for this period.</p>
            }
          </div>

          {/* ── Peak Days Heatmap ────────────────────────────────────────── */}
          <div className="card p-5">
            <SectionTitle>Peak Submission Days</SectionTitle>
            {data.peak_days.length > 0
              ? <HeatmapDays data={data.peak_days} />
              : <p className="text-sm text-gray-400">No data for this period.</p>
            }
          </div>

          {/* ── Staff Performance ────────────────────────────────────────── */}
          <div className="card p-5">
            <SectionTitle>Staff Performance</SectionTitle>
            <StaffTable staff={data.staff} totals={totals} />
          </div>
        </>
      )}

      {!loading && !data && (
        <div className="card p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">📊</div>
          <div className="font-semibold">No report data yet.</div>
          <div className="text-sm mt-1">Submit some tickets to start seeing analytics.</div>
        </div>
      )}
    </div>
  )
}