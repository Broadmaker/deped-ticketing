import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTickets } from '../../context/useTickets.jsx'
import { useOffices } from '../../context/useOffices.jsx'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badges.jsx'
import { formatDateShort } from '../../lib/utils.js'

// ─── Sort icon ────────────────────────────────────────────────────────────────
function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <span className="ml-1 opacity-20 select-none">↕</span>
  return <span className="ml-1 select-none">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

// ─── Column definitions ───────────────────────────────────────────────────────
const COLUMNS = [
  { key: 'id',        label: 'Ticket ID',  sortable: true  },
  { key: 'subject',   label: 'Subject',    sortable: true  },
  { key: 'name',      label: 'Submitter',  sortable: true  },
  { key: 'school',    label: 'School',     sortable: true  },
  { key: 'service',   label: 'Service',    sortable: false },
  { key: 'assignedTo',label: 'Assigned',   sortable: true  },
  { key: 'status',    label: 'Status',     sortable: true  },
  { key: 'priority',  label: 'Priority',   sortable: true  },
  { key: 'createdAt', label: 'Date',       sortable: true  },
]

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }
const STATUS_ORDER   = { open: 0, 'in-progress': 1, resolved: 2, closed: 3 }

export default function AdminTicketList() {
  const navigate      = useNavigate()
  const { tickets }   = useTickets()
  const { getServices } = useOffices()

  // ── Filter state ────────────────────────────────────────────────────────
  const [search,         setSearch]         = useState('')
  const [filterStatus,   setFilterStatus]   = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterService,  setFilterService]  = useState('all')

  // ── Sort state ──────────────────────────────────────────────────────────
  const [sortCol, setSortCol] = useState('createdAt')
  const [sortDir, setSortDir] = useState('desc')

  // ── Pagination state ────────────────────────────────────────────────────
  const [pageSize,    setPageSize]    = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  // ── Column visibility ───────────────────────────────────────────────────
  const [visibleCols, setVisibleCols] = useState(
    Object.fromEntries(COLUMNS.map(c => [c.key, true]))
  )
  const [showColMenu, setShowColMenu] = useState(false)

  function toggleCol(key) {
    setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // ── Unique service options from all tickets ─────────────────────────────
  const serviceOptions = useMemo(() => {
    const seen = new Set()
    const opts = []
    tickets.forEach(t => {
      if (!seen.has(t.service_id)) {
        seen.add(t.service_id)
        const svcs = getServices(t.office_id)
        const svc  = svcs.find(s => s.id === t.service_id)
        opts.push({ id: t.service_id, label: svc ? `${svc.icon} ${svc.label}` : t.service_id })
      }
    })
    return opts.sort((a, b) => a.label.localeCompare(b.label))
  }, [tickets, getServices])

  // ── Filter ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return tickets.filter(t => {
      if (filterStatus   !== 'all' && t.status   !== filterStatus)   return false
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false
      if (filterService  !== 'all' && t.service_id  !== filterService)  return false
      if (q && !(
        t.id.toLowerCase().includes(q)      ||
        t.submitter_name.toLowerCase().includes(q)    ||
        t.subject.toLowerCase().includes(q) ||
        t.submitter_school.toLowerCase().includes(q)  ||
        (t.assigned_to_name || '').toLowerCase().includes(q)
      )) return false
      return true
    })
  }, [tickets, search, filterStatus, filterPriority, filterService])

  // ── Sort ────────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal = a[sortCol] ?? ''
      let bVal = b[sortCol] ?? ''
      if (sortCol === 'priority') { aVal = PRIORITY_ORDER[aVal] ?? 9; bVal = PRIORITY_ORDER[bVal] ?? 9 }
      if (sortCol === 'status')   { aVal = STATUS_ORDER[aVal]   ?? 9; bVal = STATUS_ORDER[bVal]   ?? 9 }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ?  1 : -1
      return 0
    })
  }, [filtered, sortCol, sortDir])

  // ── Pagination ──────────────────────────────────────────────────────────
  const totalPages  = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage    = Math.min(currentPage, totalPages)
  const pageStart   = (safePage - 1) * pageSize
  const pageEnd     = Math.min(pageStart + pageSize, sorted.length)
  const paginated   = sorted.slice(pageStart, pageEnd)

  function handleSort(col) {
    if (!COLUMNS.find(c => c.key === col)?.sortable) return
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('asc') }
    setCurrentPage(1)
  }

  function handleFilterChange(setter) {
    return e => { setter(e.target.value); setCurrentPage(1) }
  }

  function clearFilters() {
    setSearch(''); setFilterStatus('all'); setFilterPriority('all'); setFilterService('all')
    setCurrentPage(1)
  }

  const hasActiveFilters = search || filterStatus !== 'all' || filterPriority !== 'all' || filterService !== 'all'

  // ── Page number buttons ─────────────────────────────────────────────────
  function pageNumbers() {
    const pages = []
    const delta = 2
    const left  = safePage - delta
    const right = safePage + delta
    let prev = null
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= left && i <= right)) {
        if (prev && i - prev > 1) pages.push('...')
        pages.push(i)
        prev = i
      }
    }
    return pages
  }

  // ── Render ──────────────────────────────────────────────────────────────
  const activeCols = COLUMNS.filter(c => visibleCols[c.key])

  return (
    <div className="p-6 space-y-4 animate-fadeUp">

      {/* ── Toolbar ── */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">

          {/* Search */}
          <div className="relative flex-1 min-w-52">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input
              className="input-field pl-8"
              placeholder="Search ID, name, subject, school, assigned..."
              value={search}
              onChange={handleFilterChange(setSearch)}
              style={{ padding: '8px 12px 8px 32px' }}
            />
          </div>

          {/* Status filter */}
          <select
            className="input-field w-auto text-sm"
            value={filterStatus}
            onChange={handleFilterChange(setFilterStatus)}
            style={{ padding: '8px 12px' }}
          >
            <option value="all">All Status</option>
            <option value="open">📬 Open</option>
            <option value="in-progress">⚙️ In Progress</option>
            <option value="resolved">✅ Resolved</option>
            <option value="closed">🔒 Closed</option>
          </select>

          {/* Priority filter */}
          <select
            className="input-field w-auto text-sm"
            value={filterPriority}
            onChange={handleFilterChange(setFilterPriority)}
            style={{ padding: '8px 12px' }}
          >
            <option value="all">All Priority</option>
            <option value="high">▲ High</option>
            <option value="medium">◆ Medium</option>
            <option value="low">▼ Low</option>
          </select>

          {/* Service filter */}
          <select
            className="input-field w-auto text-sm"
            value={filterService}
            onChange={handleFilterChange(setFilterService)}
            style={{ padding: '8px 12px' }}
          >
            <option value="all">All Services</option>
            {serviceOptions.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}
            >
              ✕ Clear
            </button>
          )}

          {/* Column toggle */}
          <div className="relative ml-auto">
            <button
              onClick={() => setShowColMenu(s => !s)}
              className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            >
              ⊞ Columns
            </button>
            {showColMenu && (
              <div
                className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-20 p-3 min-w-44"
                style={{ animation: 'fadeUp .15s ease' }}
              >
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">
                  Show / Hide Columns
                </div>
                {COLUMNS.map(col => (
                  <label
                    key={col.key}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={visibleCols[col.key]}
                      onChange={() => toggleCol(col.key)}
                      className="accent-green-700"
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">

        {/* Table info bar */}
        <div
          className="px-5 py-2.5 flex items-center justify-between text-xs border-b border-gray-100"
          style={{ background: '#f8faf9' }}
        >
          <div className="text-gray-500">
            {sorted.length === 0
              ? 'No tickets found'
              : <>
                  Showing <strong>{pageStart + 1}–{pageEnd}</strong> of{' '}
                  <strong>{sorted.length}</strong> ticket{sorted.length !== 1 ? 's' : ''}
                  {hasActiveFilters && <span className="text-gray-400"> (filtered from {tickets.length} total)</span>}
                </>
            }
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            Rows per page:
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1) }}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 ml-1 bg-white"
            >
              {PAGE_SIZE_OPTIONS.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: '#f8faf9', borderBottom: '2px solid #e5e7eb' }}>
                {activeCols.map(col => (
                  <th
                    key={col.key}
                    className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap"
                    style={col.sortable ? { cursor: 'pointer', userSelect: 'none' } : {}}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span className="flex items-center gap-0.5">
                      {col.label}
                      {col.sortable && (
                        <SortIcon col={col.key} sortCol={sortCol} sortDir={sortDir} />
                      )}
                    </span>
                  </th>
                ))}
                {/* Actions col */}
                <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeCols.length + 1}
                    className="px-5 py-16 text-center text-sm text-gray-400"
                  >
                    <div className="text-3xl mb-2">🔍</div>
                    No tickets match your filters.{' '}
                    {hasActiveFilters && (
                      <button
                        className="font-semibold"
                        style={{ color: '#0B4E3D' }}
                        onClick={clearFilters}
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : paginated.map(t => {
                const svcs = getServices(t.office_id)
                const svc  = svcs.find(s => s.id === t.service_id)
                return (
                  <tr
                    key={t.id}
                    className="transition-colors cursor-pointer group"
                    style={{ ':hover': { background: '#f0faf5' } }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8faf9'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                    onClick={() => navigate(`/admin/tickets/${t.id}`)}
                  >
                    {activeCols.map(col => {
                      switch (col.key) {
                        case 'id':
                          return (
                            <td key={col.key} className="px-5 py-3 whitespace-nowrap">
                              <span className="font-mono text-xs text-gray-400">{t.id}</span>
                            </td>
                          )
                        case 'subject':
                          return (
                            <td key={col.key} className="px-5 py-3">
                              <div className="font-medium text-gray-800 truncate max-w-[200px]">{t.subject}</div>
                            </td>
                          )
                        case 'name':
                          return (
                            <td key={col.key} className="px-5 py-3 text-gray-600 whitespace-nowrap">{t.submitter_name}</td>
                          )
                        case 'school':
                          return (
                            <td key={col.key} className="px-5 py-3 text-xs text-gray-500">
                              <div className="truncate max-w-[140px]">{t.submitter_school}</div>
                            </td>
                          )
                        case 'service':
                          return (
                            <td key={col.key} className="px-5 py-3 text-xs text-gray-600 whitespace-nowrap">
                              {svc ? `${svc.icon} ${svc.label}` : t.service_id}
                            </td>
                          )
                        case 'assignedTo':
                          return (
                            <td key={col.key} className="px-5 py-3 text-xs whitespace-nowrap">
                              {t.assigned_to_name
                                ? <span className="flex items-center gap-1.5">
                                    <span
                                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                      style={{ background: '#1d6fa4', fontSize: 8 }}
                                    >
                                      {t.assigned_to_name[0]}
                                    </span>
                                    <span className="text-gray-600">{t.assigned_to_name}</span>
                                  </span>
                                : <span className="text-gray-300 italic">Unassigned</span>
                              }
                            </td>
                          )
                        case 'status':
                          return <td key={col.key} className="px-5 py-3"><StatusBadge status={t.status} /></td>
                        case 'priority':
                          return <td key={col.key} className="px-5 py-3"><PriorityBadge priority={t.priority} /></td>
                        case 'createdAt':
                          return (
                            <td key={col.key} className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                              {formatDateShort(t.created_at)}
                            </td>
                          )
                        default:
                          return <td key={col.key} className="px-5 py-3">—</td>
                      }
                    })}
                    {/* View button */}
                    <td className="px-5 py-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/admin/tickets/${t.id}`)}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        style={{ background: '#e8f5f1', color: '#0B4E3D' }}
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination footer ── */}
        {totalPages > 1 && (
          <div
            className="px-5 py-3 flex items-center justify-between border-t border-gray-100 flex-wrap gap-3"
            style={{ background: '#f8faf9' }}
          >
            <button
              disabled={safePage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'white', border: '1px solid #e5e7eb', color: '#374151' }}
            >
              ← Previous
            </button>

            <div className="flex items-center gap-1">
              {pageNumbers().map((p, i) =>
                p === '...'
                  ? <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-xs">…</span>
                  : <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className="w-8 h-8 rounded-lg text-xs font-semibold transition-colors"
                      style={safePage === p
                        ? { background: '#0B4E3D', color: 'white' }
                        : { background: 'white', border: '1px solid #e5e7eb', color: '#374151' }
                      }
                    >
                      {p}
                    </button>
              )}
            </div>

            <button
              disabled={safePage === totalPages}
              onClick={() => setCurrentPage(p => p + 1)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'white', border: '1px solid #e5e7eb', color: '#374151' }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

    </div>
  )
}