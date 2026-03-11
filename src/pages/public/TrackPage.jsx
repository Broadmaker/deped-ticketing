// src/pages/public/TrackPage.jsx
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api.js'
import { StatusBadge, PriorityBadge } from '../../components/ui/Badges.jsx'
import { formatDate } from '../../lib/utils.js'

export default function TrackPage() {
  const [searchParams] = useSearchParams()
  const [trackId,     setTrackId]  = useState(searchParams.get('id') || '')
  const [result,      setResult]   = useState(null)
  const [error,       setError]    = useState('')
  const [loading,     setLoading]  = useState(false)

  // Auto-search if ?id= is in the URL
  useEffect(() => {
    const id = searchParams.get('id')
    if (id) { setTrackId(id); doSearch(id) }
  }, [])

  async function doSearch(id) {
    const query = (id || trackId).trim()
    if (!query) return
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await api.get(`/tickets/track/${query.toUpperCase()}`)
      setResult(data)
    } catch (err) {
      setError(err.status === 404
        ? 'No ticket found with that ID. Please check and try again.'
        : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    doSearch()
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fadeUp">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Track Your Ticket</h2>
      <p className="text-sm text-gray-500 mb-6">
        Enter your ticket ID to check the current status of your concern.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3 mb-6">
        <input
          className="input-field flex-1 uppercase"
          placeholder="e.g. TKT-2025-0001"
          value={trackId}
          onChange={e => setTrackId(e.target.value.toUpperCase())}
        />
        <button className="btn-primary px-6" type="submit" disabled={loading}>
          {loading ? '⏳' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="rounded-xl p-4 mb-4 text-sm"
          style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div className="card overflow-hidden animate-fadeUp">
          <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3"
            style={{ background: '#f8faf9' }}>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Ticket ID</div>
              <div className="text-xl font-bold tracking-wide"
                style={{ color: '#0B4E3D', fontFamily: 'monospace' }}>
                {result.id}
              </div>
            </div>
            <StatusBadge status={result.status} />
          </div>

          <div className="p-5 space-y-3">
            <div className="text-base font-bold text-gray-800">{result.subject}</div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>📅 {formatDate(result.created_at)}</span>
              <span>🏫 {result.submitter_school}</span>
              <PriorityBadge priority={result.priority} />
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-gray-500">
              <span>🏢 {result.office_name}</span>
              <span>{result.service_icon} {result.service_label}</span>
              {result.assigned_to_name && (
                <span>👤 Assigned to: <strong>{result.assigned_to_name}</strong></span>
              )}
            </div>

            {result.resolution && (
              <div className="rounded-lg p-3 text-sm"
                style={{ background: '#e8f5f1', color: '#0B4E3D' }}>
                <strong>✓ Resolution:</strong> {result.resolution}
              </div>
            )}

            {result.replies?.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Updates ({result.replies.length})
                </div>
                {result.replies.map((r, i) => (
                  <div key={i} className="rounded-lg p-3 text-sm" style={{ background: '#f8faf9' }}>
                    <div className="text-xs text-gray-400 mb-1">
                      {r.author_name} · {formatDate(r.created_at)}
                    </div>
                    <div>{r.message}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs text-gray-400 pt-1">
              Last updated: {formatDate(result.updated_at)}
            </div>
          </div>
        </div>
      )}

      <div className="mt-6 p-4 rounded-xl text-sm"
        style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
        <strong className="text-yellow-800">💡 Tip:</strong>
        <span className="text-yellow-700 ml-1">
          Your ticket ID was shown after submission. It looks like <span className="font-mono font-bold">TKT-2025-0001</span>.
        </span>
      </div>
    </div>
  )
}