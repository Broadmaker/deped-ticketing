// src/pages/public/CsmPage.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api.js'

// ── SQD Rating Scale ──────────────────────────────────────────────────────────
const SQD_OPTIONS = [
  { value: 1, label: 'Strongly Disagree', emoji: '😠' },
  { value: 2, label: 'Disagree',          emoji: '😞' },
  { value: 3, label: 'Neither Agree nor Disagree', emoji: '😐' },
  { value: 4, label: 'Agree',             emoji: '😊' },
  { value: 5, label: 'Strongly Agree',    emoji: '😄' },
]

const SQD_QUESTIONS = [
  { id: 'sqd0', label: 'SQD0', text: 'I am satisfied with the service that I availed.' },
  { id: 'sqd1', label: 'SQD1', text: 'I spent an acceptable amount of time for my transaction.' },
  { id: 'sqd2', label: 'SQD2', text: 'The office followed the transaction\'s requirements and steps based on the information provided.' },
  { id: 'sqd3', label: 'SQD3', text: 'The steps (including payment) I needed to do for my transaction were easy and simple.' },
  { id: 'sqd4', label: 'SQD4', text: 'I easily found information about my transaction from the office or its website.' },
  { id: 'sqd5', label: 'SQD5', text: 'I paid an acceptable amount of fees for my transaction.' },
  { id: 'sqd6', label: 'SQD6', text: 'I feel the office was fair to everyone, or "walang palakasan", during my transaction.' },
  { id: 'sqd7', label: 'SQD7', text: 'I was treated courteously by the staff, and (if asked for help) the staff was helpful.' },
  { id: 'sqd8', label: 'SQD8', text: 'I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me.' },
]

function SqdRow({ question, value, onChange, required }) {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-3 text-xs text-gray-700 w-1/2">
        <span className="font-bold text-green-800 mr-1">{question.label}.</span>
        {question.text}
        {required && !value && <span className="text-red-500 ml-1">*</span>}
      </td>
      {SQD_OPTIONS.map(opt => (
        <td key={opt.value} className="py-3 px-2 text-center">
          <button type="button"
            onClick={() => onChange(opt.value)}
            title={opt.label}
            className="flex flex-col items-center mx-auto gap-0.5 group transition-transform hover:scale-110 focus:outline-none">
            <span className="text-xl transition-all"
              style={{ filter: value === opt.value ? 'none' : 'grayscale(0.8) opacity(0.4)', fontSize: value === opt.value ? 26 : 20 }}>
              {opt.emoji}
            </span>
            {value === opt.value && (
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#0B4E3D' }} />
            )}
          </button>
        </td>
      ))}
      <td className="py-3 px-2 text-center">
        <button type="button"
          onClick={() => onChange('NA')}
          className="text-xs px-2 py-1 rounded border transition-all"
          style={{
            background:  value === 'NA' ? '#f3f4f6' : 'transparent',
            borderColor: value === 'NA' ? '#9ca3af' : '#e5e7eb',
            color:       value === 'NA' ? '#374151' : '#9ca3af',
            fontWeight:  value === 'NA' ? 700 : 400,
          }}>
          N/A
        </button>
      </td>
    </tr>
  )
}

export default function CsmPage() {
  const { token } = useParams()
  const navigate  = useNavigate()

  const [survey,     setSurvey]     = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done,       setDone]       = useState(false)

  // ── Header fields ──────────────────────────────────────────────────────────
  const [clientType, setClientType] = useState('')
  const [sex,        setSex]        = useState('')
  const [age,        setAge]        = useState('')

  // ── CC Questions ───────────────────────────────────────────────────────────
  const [cc1, setCc1] = useState('')
  const [cc2, setCc2] = useState('')
  const [cc3, setCc3] = useState('')

  // ── SQD Ratings ────────────────────────────────────────────────────────────
  const [sqd, setSqd] = useState({
    sqd0:'', sqd1:'', sqd2:'', sqd3:'', sqd4:'', sqd5:'', sqd6:'', sqd7:'', sqd8:''
  })

  // ── Suggestions ────────────────────────────────────────────────────────────
  const [suggestions, setSuggestions] = useState('')
  const [email,       setEmail]       = useState('')

  useEffect(() => {
    if (!token) { setError('Invalid survey link.'); setLoading(false); return }
    api.get(`/csm/${token}`)
      .then(data => { setSurvey(data); if (data.already_done) setDone(true) })
      .catch(err => setError(err.message || 'Survey not found or link has expired.'))
      .finally(() => setLoading(false))
  }, [token])

  function setSqdVal(key, val) {
    setSqd(prev => ({ ...prev, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    // Validate required SQD fields (0,1,2,3,7,8 are core)
    const missingSqd = SQD_QUESTIONS.filter(q => !sqd[q.id])
    if (missingSqd.length > 0) {
      setError(`Please answer all SQD questions (${missingSqd.map(q => q.label).join(', ')}).`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    if (!cc1) { setError('Please answer CC1.'); return }

    setError('')
    setSubmitting(true)
    try {
      await api.post(`/csm/${token}`, {
        client_type: clientType,
        sex, age: age || null,
        cc1, cc2, cc3,
        sqd0: sqd.sqd0, sqd1: sqd.sqd1, sqd2: sqd.sqd2,
        sqd3: sqd.sqd3, sqd4: sqd.sqd4, sqd5: sqd.sqd5,
        sqd6: sqd.sqd6, sqd7: sqd.sqd7, sqd8: sqd.sqd8,
        suggestions: suggestions.trim() || null,
        email_optional: email.trim() || null,
      })
      setDone(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
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
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#0B4E3D' }}>THANK YOU!</h2>
        <p className="text-gray-500 text-sm mb-2">
          Your feedback has been recorded and your ticket has been closed.
        </p>
        <p className="text-gray-400 text-xs mb-6">
          Your response helps us improve our services at DepEd Division of Zamboanga Sibugay.
        </p>
        <button onClick={() => navigate('/')}
          className="px-6 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: '#0B4E3D' }}>
          Back to Home
        </button>
      </div>
    </div>
  )

  // ── Survey Form ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen py-8 px-4" style={{ background: '#f0f4f3' }}>
      <div className="max-w-3xl mx-auto">

        {/* Official Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-4">
          <div className="text-center py-5 px-6 border-b border-gray-200"
            style={{ background: 'linear-gradient(135deg,#0B4E3D,#16735a)' }}>
            <p className="text-white text-xs font-bold uppercase tracking-widest mb-1 opacity-80">
              Republic of the Philippines
            </p>
            <h1 className="text-white text-xl font-black tracking-wide">
              HELP US SERVE YOU BETTER!
            </h1>
            <p className="text-white text-xs mt-1 opacity-75">
              DepEd Division of Zamboanga Sibugay — ICT Helpdesk
            </p>
          </div>

          <div className="px-6 py-4 text-xs text-gray-600 leading-relaxed border-b border-gray-100"
            style={{ background: '#fafafa' }}>
            This <strong>Client Satisfaction Measurement (CSM)</strong> tracks the customer experience of government offices.
            Your feedback on your <u>recently concluded transaction</u> will help this office provide a better service.
            Personal information shared will be kept confidential and you always have the option to not answer this form.
          </div>

          {/* Ticket Reference */}
          {survey && (
            <div className="px-6 py-3 flex flex-wrap gap-4 text-xs border-b border-gray-100 bg-green-50">
              <span><strong style={{ color:'#0B4E3D' }}>Ticket:</strong> {survey.ticket_id}</span>
              <span><strong style={{ color:'#0B4E3D' }}>Service Availed:</strong> {survey.service} — {survey.office}</span>
              <span><strong style={{ color:'#0B4E3D' }}>Subject:</strong> {survey.subject}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="px-6 py-5">

            {/* Error banner */}
            {error && (
              <div className="rounded-xl px-4 py-3 text-sm font-medium mb-4"
                style={{ background: '#fee2e2', color: '#991b1b' }}>
                ⚠️ {error}
              </div>
            )}

            {/* ── Personal Info ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 pb-5 border-b border-gray-200">
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2">Client type:</p>
                <div className="flex flex-wrap gap-2">
                  {['Citizen','Business','Government'].map(t => (
                    <label key={t} className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-700">
                      <input type="radio" name="clientType" value={t}
                        checked={clientType === t} onChange={() => setClientType(t)}
                        className="accent-green-800" />
                      {t}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2">Sex:</p>
                <div className="flex gap-4">
                  {['Male','Female'].map(s => (
                    <label key={s} className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-700">
                      <input type="radio" name="sex" value={s}
                        checked={sex === s} onChange={() => setSex(s)}
                        className="accent-green-800" />
                      {s}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-600 mb-2">Age:</p>
                <input type="number" min="1" max="120" value={age}
                  onChange={e => setAge(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs w-24 focus:outline-none focus:ring-1"
                  style={{ '--tw-ring-color': '#0B4E3D' }}
                  placeholder="e.g. 35" />
              </div>
            </div>

            {/* ── CC Questions ── */}
            <div className="mb-5 pb-5 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                INSTRUCTIONS: Check (✓) your answer to the Citizen's Charter (CC) questions.
              </p>

              {/* CC1 */}
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-800 mb-2">
                  CC1 &nbsp; Which of the following best describes your awareness of a CC?
                  <span className="text-red-500 ml-1">*</span>
                </p>
                <div className="space-y-1.5 pl-3">
                  {[
                    '1. I know what a CC is and I saw this office\'s CC.',
                    '2. I know what a CC is but I did NOT see this office\'s CC.',
                    '3. I learned of the CC only when I saw this office\'s CC.',
                    '4. I do not know what a CC is and I did not see one in this office. (Answer \'N/A\' on CC2 and CC3)',
                  ].map((opt, i) => (
                    <label key={i} className="flex items-start gap-2 cursor-pointer text-xs text-gray-700">
                      <input type="radio" name="cc1" value={String(i+1)}
                        checked={cc1 === String(i+1)} onChange={() => setCc1(String(i+1))}
                        className="mt-0.5 accent-green-800" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              {/* CC2 */}
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-800 mb-2">
                  CC2 &nbsp; If aware of CC (answered 1-3 in CC1), would you say that the CC of this was…?
                </p>
                <div className="grid grid-cols-2 gap-1.5 pl-3">
                  {['1. Easy to see','2. Somewhat easy to see','3. Difficult to see','4. Not visible at all','5. N/A'].map((opt, i) => (
                    <label key={i} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                      <input type="radio" name="cc2" value={String(i+1)}
                        checked={cc2 === String(i+1)} onChange={() => setCc2(String(i+1))}
                        className="accent-green-800" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              {/* CC3 */}
              <div>
                <p className="text-xs font-bold text-gray-800 mb-2">
                  CC3 &nbsp; If aware of CC (answered codes 1-3 in CC1), how much did the CC help you in your transaction?
                </p>
                <div className="grid grid-cols-2 gap-1.5 pl-3">
                  {['1. Helped very much','2. Somewhat helped','3. Did not help','4. N/A'].map((opt, i) => (
                    <label key={i} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                      <input type="radio" name="cc3" value={String(i+1)}
                        checked={cc3 === String(i+1)} onChange={() => setCc3(String(i+1))}
                        className="accent-green-800" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* ── SQD Table ── */}
            <div className="mb-5 pb-5 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
                INSTRUCTIONS: For SQD 0-8, please put a check mark (✓) on the column that best corresponds to your answer.
              </p>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: '#0B4E3D' }}>
                      <th className="text-left py-3 px-3 text-white font-bold w-1/2">Question</th>
                      {SQD_OPTIONS.map(opt => (
                        <th key={opt.value} className="py-3 px-1 text-center text-white font-semibold" style={{ minWidth: 60 }}>
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-lg">{opt.emoji}</span>
                            <span className="text-white opacity-90" style={{ fontSize: 9, lineHeight: 1.2 }}>{opt.label}</span>
                          </div>
                        </th>
                      ))}
                      <th className="py-3 px-2 text-center text-white font-semibold" style={{ fontSize: 10 }}>N/A</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SQD_QUESTIONS.map((q, i) => (
                      <SqdRow key={q.id} question={q}
                        value={sqd[q.id]}
                        onChange={val => setSqdVal(q.id, val)}
                        required={true} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Suggestions ── */}
            <div className="mb-5">
              <label className="text-xs font-bold text-gray-700 block mb-2">
                Suggestions on how we can further improve our services (optional):
              </label>
              <textarea rows={3} value={suggestions} onChange={e => setSuggestions(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-xs text-gray-700 resize-none focus:outline-none focus:ring-1"
                style={{ '--tw-ring-color': '#0B4E3D' }}
                placeholder="Write your suggestions here..." />
            </div>

            <div className="mb-6">
              <label className="text-xs font-bold text-gray-700 block mb-2">
                Email address (optional):
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="border border-gray-300 rounded-xl px-4 py-2 text-xs w-full max-w-sm focus:outline-none focus:ring-1"
                style={{ '--tw-ring-color': '#0B4E3D' }}
                placeholder="your.email@example.com" />
            </div>

            {/* Submit */}
            <button type="submit" disabled={submitting}
              className="w-full py-4 rounded-xl text-white font-black text-sm tracking-wide transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#0B4E3D,#16735a)' }}>
              {submitting ? '⏳ Submitting...' : '📤 Submit & Close Ticket'}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3 font-bold tracking-wider">
              — THANK YOU! —
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}