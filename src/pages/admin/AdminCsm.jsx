// src/pages/admin/AdminCsm.jsx
import { useState, useEffect } from 'react'
import { api } from '../../lib/api.js'

const SQD_LABELS = {
  sqd0: 'SQD0 — Overall Satisfaction',
  sqd1: 'SQD1 — Acceptable Time',
  sqd2: 'SQD2 — Followed Requirements',
  sqd3: 'SQD3 — Easy & Simple Steps',
  sqd4: 'SQD4 — Found Information Easily',
  sqd5: 'SQD5 — Acceptable Fees',
  sqd6: 'SQD6 — Fair Treatment',
  sqd7: 'SQD7 — Staff Courtesy',
  sqd8: 'SQD8 — Got What Was Needed',
}

const EMOJI_MAP = { '1':'😠','2':'😞','3':'😐','4':'😊','5':'😄','NA':'—' }
const LABEL_MAP = { '1':'Strongly Disagree','2':'Disagree','3':'Neither','4':'Agree','5':'Strongly Agree','NA':'N/A' }

function SqdCell({ value }) {
  if (!value) return <span className="text-gray-300 text-xs">—</span>
  return (
    <span className="flex items-center gap-1 text-xs">
      <span>{EMOJI_MAP[value] || '—'}</span>
      <span className="text-gray-500 hidden md:inline">{LABEL_MAP[value]}</span>
    </span>
  )
}

function ScoreCard({ label, value, icon, color }) {
  return (
    <div className="rounded-2xl p-5 shadow-sm border border-gray-100 bg-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
        <span>{icon}</span>
      </div>
      <div className="text-3xl font-black" style={{ color }}>{value ?? '—'}</div>
    </div>
  )
}

export default function AdminCsm() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    api.get('/csm')
      .then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  const results = (data?.results || []).filter(r => {
    const q = search.toLowerCase()
    return !q ||
      r.ticket_id?.toLowerCase().includes(q) ||
      r.submitter_name?.toLowerCase().includes(q) ||
      r.subject?.toLowerCase().includes(q) ||
      r.office_name?.toLowerCase().includes(q)
  })

  const avg = data?.averages

  function fmtDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><div className="text-4xl mb-3 animate-pulse">📋</div>
        <p className="text-gray-400 text-sm">Loading responses...</p></div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: '#0B4E3D' }}>📋 CSM Survey Results</h1>
        <p className="text-sm text-gray-500 mt-1">Client Satisfaction Measurement — DepEd Division of Zamboanga Sibugay</p>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <ScoreCard label="Total Responses" icon="📊" value={avg?.total || 0} color="#0B4E3D" />
        <ScoreCard label="Avg. Satisfaction (SQD0)" icon="😊"
          value={avg?.avg_sqd0 ? `${avg.avg_sqd0}/5` : '—'} color="#FFC107" />
        <ScoreCard label="Avg. Staff Courtesy (SQD7)" icon="🤝"
          value={avg?.avg_sqd7 ? `${avg.avg_sqd7}/5` : '—'} color="#1d6fa4" />
        <ScoreCard label="Avg. Issue Resolved (SQD8)" icon="✅"
          value={avg?.avg_sqd8 ? `${avg.avg_sqd8}/5` : '—'} color="#16a34a" />
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-5">
        <input type="text" placeholder="Search by ticket, name, office, subject..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-1"
          style={{ '--tw-ring-color': '#0B4E3D' }} />
        <span className="text-sm text-gray-400 self-center">{results.length} result{results.length !== 1 ? 's' : ''}</span>
      </div>

      {results.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-gray-500 font-medium">No survey responses yet.</p>
          <p className="text-gray-400 text-sm mt-1">Responses appear here after submitters complete the CSM survey.</p>
        </div>
      )}

      <div className="space-y-3">
        {results.map((r, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Summary row */}
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
              onClick={() => setExpanded(expanded === i ? null : i)}>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-black text-sm" style={{ color: '#0B4E3D' }}>{r.ticket_id}</span>
                <span className="text-sm text-gray-700 font-medium">{r.submitter_name}</span>
                <span className="text-xs text-gray-400">{r.office_name}</span>
                {r.client_type && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{r.client_type}</span>
                )}
                {r.sex && <span className="text-xs text-gray-400">{r.sex}{r.age ? `, ${r.age}` : ''}</span>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{fmtDate(r.submitted_at)}</span>
                <span className="text-gray-400 text-xs">{expanded === i ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Expanded details */}
            {expanded === i && (
              <div className="border-t border-gray-100 px-5 py-4 space-y-4">

                {/* Subject */}
                <p className="text-sm text-gray-600">
                  <strong className="text-gray-800">Subject:</strong> {r.subject}
                  {r.assigned_to_name && <span className="ml-3 text-gray-400">• Handled by <strong>{r.assigned_to_name}</strong></span>}
                </p>

                {/* CC Answers */}
                <div className="rounded-xl p-4 border border-gray-100" style={{ background: '#f8faf9' }}>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Citizen's Charter (CC)</p>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    {[['CC1','cc1'],['CC2','cc2'],['CC3','cc3']].map(([label, key]) => (
                      <div key={key}>
                        <span className="font-bold text-gray-600">{label}:</span>
                        <span className="ml-1 text-gray-700">{r[key] || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SQD Table */}
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <table className="w-full text-xs">
                    <thead style={{ background: '#0B4E3D' }}>
                      <tr>
                        <th className="text-left py-2 px-3 text-white font-bold">SQD Question</th>
                        <th className="text-center py-2 px-3 text-white font-bold">Response</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(SQD_LABELS).map(([key, label], idx) => (
                        <tr key={key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="py-2 px-3 text-gray-700">{label}</td>
                          <td className="py-2 px-3 text-center"><SqdCell value={r[key]} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Suggestions */}
                {r.suggestions && (
                  <div className="rounded-xl px-4 py-3 text-sm text-gray-600 italic border-l-4"
                    style={{ background: '#fef9e7', borderColor: '#FFC107' }}>
                    💬 "{r.suggestions}"
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}