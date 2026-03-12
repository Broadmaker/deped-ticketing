// src/pages/public/CsmPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'

function StarRating({ label, value, onChange, required }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {value > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: value >= 4 ? '#d1fae5' : value >= 3 ? '#fef3c7' : '#fee2e2',
                     color:      value >= 4 ? '#065f46' : value >= 3 ? '#92400e' : '#991b1b' }}>
            {['','Poor','Fair','Good','Very Good','Excellent'][value]}
          </span>
        )}
      </div>
      <div className="flex gap-2">
        {[1,2,3,4,5].map(star => (
          <button key={star} type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="text-3xl transition-transform hover:scale-110 focus:outline-none"
            style={{ filter: star <= (hovered || value) ? 'none' : 'grayscale(1) opacity(0.3)' }}>
            ⭐
          </button>
        ))}
      </div>
    </div>
  )
}

export default function CsmPage() {
  const { token } = useParams()
  const navigate  = useNavigate()

  const [survey,   setSurvey]   = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done,     setDone]     = useState(false)

  // Form state
  const [overall,      setOverall]      = useState(0)
  const [resolved,     setResolved]     = useState(null)   // true/false
  const [responseTime, setResponseTime] = useState(0)
  const [staffRating,  setStaffRating]  = useState(0)
  const [comments,     setComments]     = useState('')

  useEffect(() => {
    if (!token) { setError('Invalid survey link.'); setLoading(false); return }
    api.get(`/csm/${token}`)
      .then(data => { setSurvey(data); if (data.already_done) setDone(true) })
      .catch(err => setError(err.message || 'Survey not found or link has expired.'))
      .finally(() => setLoading(false))
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!overall)            return setError('Please rate your overall satisfaction.')
    if (resolved === null)   return setError('Please tell us if your issue was resolved.')
    if (!responseTime)       return setError('Please rate the response time.')
    if (!staffRating)        return setError('Please rate staff professionalism.')

    setError('')
    setSubmitting(true)
    try {
      await api.post(`/csm/${token}`, {
        overall_rating:       overall,
        issue_resolved:       resolved,
        response_time_rating: responseTime,
        staff_rating:         staffRating,
        comments:             comments.trim() || null,
      })
      setDone(true)
    } catch (err) {
      setError(err.message || 'Failed to submit survey.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f0f4f3' }}>
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">📋</div>
        <p className="text-gray-500 font-medium">Loading survey...</p>
      </div>
    </div>
  )

  // ── Error ─────────────────────────────────────────────────────────────────
  if (!survey && error) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f0f4f3' }}>
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Survey Not Found</h2>
        <p className="text-gray-500 text-sm">{error}</p>
      </div>
    </div>
  )

  // ── Already submitted ─────────────────────────────────────────────────────
  if (done) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#f0f4f3' }}>
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mx-auto mb-5"
          style={{ background: '#d1fae5' }}>✅</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#0B4E3D' }}>Thank You!</h2>
        <p className="text-gray-500 text-sm mb-2">
          Your feedback has been recorded and your ticket has been closed.
        </p>
        <p className="text-gray-400 text-xs mb-6">
          Your response helps us improve our ICT services at DepEd Division of Zamboanga Sibugay.
        </p>
        <button onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: '#0B4E3D' }}>
          Back to Home
        </button>
      </div>
    </div>
  )

  // ── Survey Form ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-10 px-4" style={{ background: '#f0f4f3' }}>
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="rounded-2xl p-7 mb-5 text-white text-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #0B4E3D 0%, #16735a 100%)' }}>
          <div className="text-4xl mb-2">📋</div>
          <h1 className="text-xl font-bold mb-1">Client Satisfaction Survey</h1>
          <p className="text-sm opacity-80">DepEd Division of Zamboanga Sibugay — ICT Helpdesk</p>
        </div>

        {/* Ticket info */}
        <div className="bg-white rounded-2xl shadow p-5 mb-5 border-l-4" style={{ borderColor: '#0B4E3D' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#0B4E3D' }}>
            Your Ticket
          </p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-gray-400">Ticket ID</span><br/>
              <span className="font-bold text-gray-800">{survey.ticket_id}</span></div>
            <div><span className="text-gray-400">Submitter</span><br/>
              <span className="font-semibold text-gray-800">{survey.submitter}</span></div>
            <div><span className="text-gray-400">Office</span><br/>
              <span className="font-semibold text-gray-700">{survey.office}</span></div>
            <div><span className="text-gray-400">Service</span><br/>
              <span className="font-semibold text-gray-700">{survey.service}</span></div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-gray-400 text-xs">Concern: </span>
            <span className="text-sm text-gray-700 font-medium">{survey.subject}</span>
          </div>
        </div>

        {/* Notice */}
        <div className="rounded-xl px-4 py-3 mb-5 text-sm flex items-start gap-2"
          style={{ background: '#fef9e7', border: '1px solid #FFC107' }}>
          <span className="text-lg">⚠️</span>
          <p style={{ color: '#92400e' }}>
            <strong>Please complete this survey</strong> — your ticket will be officially closed
            once you submit your feedback. All fields marked <span className="text-red-500 font-bold">*</span> are required.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow p-7 space-y-2">

          {/* Q1 — Overall satisfaction */}
          <StarRating label="1. Overall Satisfaction with the service received"
            value={overall} onChange={setOverall} required />

          {/* Q2 — Issue resolved */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 block mb-3">
              2. Was your issue fully resolved? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {[{ val: true, label: '✅ Yes, fully resolved', bg: '#d1fae5', color: '#065f46', border: '#6ee7b7' },
                { val: false, label: '❌ No, not fully resolved', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' }
              ].map(opt => (
                <button key={String(opt.val)} type="button"
                  onClick={() => setResolved(opt.val)}
                  className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all"
                  style={{
                    background:   resolved === opt.val ? opt.bg : 'transparent',
                    color:        resolved === opt.val ? opt.color : '#6b7280',
                    borderColor:  resolved === opt.val ? opt.border : '#e5e7eb',
                  }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Q3 — Response time */}
          <StarRating label="3. Response Time — How quickly was your ticket attended to?"
            value={responseTime} onChange={setResponseTime} required />

          {/* Q4 — Staff professionalism */}
          <StarRating label="4. Staff Professionalism — Courtesy and helpfulness of staff"
            value={staffRating} onChange={setStaffRating} required />

          {/* Q5 — Comments */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-gray-700 block mb-2">
              5. Comments & Suggestions <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea rows={4} value={comments} onChange={e => setComments(e.target.value)}
              placeholder="Share any additional feedback, suggestions, or concerns..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#0B4E3D' }} />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium"
              style={{ background: '#fee2e2', color: '#991b1b' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={submitting}
            className="w-full py-4 rounded-xl text-white font-bold text-base transition-opacity disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #0B4E3D, #16735a)' }}>
            {submitting ? '⏳ Submitting...' : '📤 Submit Feedback & Close Ticket'}
          </button>

          <p className="text-center text-xs text-gray-400 pt-1">
            Your responses are confidential and used only to improve our services.
          </p>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5">
          DepEd Division of Zamboanga Sibugay — ICT Helpdesk System
        </p>
      </div>
    </div>
  )
}