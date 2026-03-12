// src/pages/admin/AdminCsm.jsx
import { useState, useEffect } from 'react'
import { api } from '../../lib/api.js'
import { useAuth } from '../../context/useAuth.jsx'

function Stars({ value }) {
  if (!value) return <span className="text-gray-300 text-xs">No rating</span>
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(s => (
        <span key={s} style={{ color: s <= value ? '#FFC107' : '#e5e7eb', fontSize: 14 }}>★</span>
      ))}
      <span className="ml-1 text-xs font-bold text-gray-600">{value}/5</span>
    </span>
  )
}

function ScoreCard({ label, value, icon, color }) {
  return (
    <div className="rounded-2xl p-5 shadow-sm border border-gray-100 bg-white">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="text-3xl font-black" style={{ color }}>
        {value !== null && value !== undefined ? value : '—'}
      </div>
    </div>
  )
}

export default function AdminCsm() {
  const { currentUser } = useAuth()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [filter,  setFilter]  = useState('all') // all | resolved | unresolved

  useEffect(() => {
    api.get('/csm')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const results = (data?.results || []).filter(r => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      r.ticket_id?.toLowerCase().includes(q) ||
      r.submitter_name?.toLowerCase().includes(q) ||
      r.subject?.toLowerCase().includes(q)
    const matchFilter =
      filter === 'all' ? true :
      filter === 'resolved' ? r.issue_resolved :
      !r.issue_resolved
    return matchSearch && matchFilter
  })

  const avg = data?.averages

  function fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">📋</div>
        <p className="text-gray-400 text-sm">Loading survey results...</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: '#0B4E3D' }}>
          📋 Client Satisfaction Survey Results
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Feedback submitted by ticket submitters after issue resolution
        </p>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ScoreCard label="Total Responses"    icon="📊"
          value={avg?.total || 0}
          color="#0B4E3D" />
        <ScoreCard label="Avg. Satisfaction"  icon="⭐"
          value={avg?.avg_overall ? `${Number(avg.avg_overall).toFixed(1)} / 5` : '—'}
          color="#FFC107" />
        <ScoreCard label="Avg. Response Time" icon="⏱️"
          value={avg?.avg_response_time ? `${Number(avg.avg_response_time).toFixed(1)} / 5` : '—'}
          color="#1d6fa4" />
        <ScoreCard label="Issue Resolved"     icon="✅"
          value={avg?.total ? `${Math.round((avg.resolved_yes / avg.total) * 100)}%` : '—'}
          color="#16a34a" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by ticket, name, subject..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': '#0B4E3D' }}
        />
        <div className="flex gap-2">
          {[['all','All'],['resolved','✅ Resolved'],['unresolved','❌ Not Resolved']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className="px-4 py-2 rounded-xl text-xs font-bold border transition-all"
              style={{
                background:  filter === val ? '#0B4E3D' : 'white',
                color:       filter === val ? 'white'   : '#374151',
                borderColor: filter === val ? '#0B4E3D' : '#e5e7eb',
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* No results */}
      {results.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500 font-medium">No survey responses yet.</p>
          <p className="text-gray-400 text-sm mt-1">
            Responses appear here after tickets are resolved and submitters complete the survey.
          </p>
        </div>
      )}

      {/* Results list */}
      <div className="space-y-4">
        {results.map((r, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50"
              style={{ background: '#f8faf9' }}>
              <div className="flex items-center gap-3">
                <span className="font-black text-sm" style={{ color: '#0B4E3D' }}>{r.ticket_id}</span>
                <span className="text-gray-400 text-xs">•</span>
                <span className="text-sm font-medium text-gray-700">{r.submitter_name}</span>
                <span className="text-gray-400 text-xs">•</span>
                <span className="text-xs text-gray-500">{r.office_name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  r.issue_resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {r.issue_resolved ? '✅ Resolved' : '❌ Not Resolved'}
                </span>
                <span className="text-xs text-gray-400">{fmtDate(r.submitted_at)}</span>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              <p className="text-sm text-gray-600 mb-4">
                <span className="font-semibold text-gray-800">Subject:</span> {r.subject}
                {r.assigned_to_name && (
                  <span className="ml-3 text-gray-400">
                    • Handled by <span className="font-medium text-gray-600">{r.assigned_to_name}</span>
                  </span>
                )}
              </p>

              {/* Ratings grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="rounded-xl p-3 bg-gray-50">
                  <p className="text-xs text-gray-400 mb-1">Overall Satisfaction</p>
                  <Stars value={r.overall_rating} />
                </div>
                <div className="rounded-xl p-3 bg-gray-50">
                  <p className="text-xs text-gray-400 mb-1">Response Time</p>
                  <Stars value={r.response_time_rating} />
                </div>
                <div className="rounded-xl p-3 bg-gray-50">
                  <p className="text-xs text-gray-400 mb-1">Staff Professionalism</p>
                  <Stars value={r.staff_rating} />
                </div>
              </div>

              {/* Comments */}
              {r.comments && (
                <div className="rounded-xl px-4 py-3 text-sm text-gray-600 italic border-l-4"
                  style={{ background: '#fef9e7', borderColor: '#FFC107' }}>
                  💬 "{r.comments}"
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}