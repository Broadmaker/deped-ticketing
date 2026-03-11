import { useNavigate } from 'react-router-dom'
import { useTickets } from '../../context/useTickets.jsx'
import { useOffices } from '../../context/useOffices.jsx'

export default function HomePage() {
  const navigate = useNavigate()
  const { tickets } = useTickets()
  const { offices } = useOffices()

  const stats = {
    total:      tickets.length,
    open:       tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved:   tickets.filter(t => t.status === 'resolved').length,
  }

  function handleOfficeClick(office) {
    if (office.comingSoon) return
    navigate(`/submit?office=${office.id}`)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeUp">

      {/* Hero */}
      <div
        className="rounded-2xl overflow-hidden mb-8 hero-pattern"
        style={{ background: '#0B4E3D', minHeight: 220 }}
      >
        <div className="p-10">
          <div
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: '#FFC107' }}
          >
            Division of Zamboanga Sibugay
          </div>
          <h1
            className="font-serif text-white text-4xl mb-3"
            style={{ lineHeight: 1.2 }}
          >
            How can we help you<br />today?
          </h1>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 460 }}>
            Submit your concern to the appropriate office and track your
            ticket's progress in real time.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button className="btn-gold" onClick={() => navigate('/submit')}>
              📝 Submit a Ticket
            </button>
            <button
              className="btn-secondary"
              style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}
              onClick={() => navigate('/track')}
            >
              🔍 Track My Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Tickets', val: stats.total,      icon: '🎫', color: '#0B4E3D' },
          { label: 'Open',          val: stats.open,       icon: '📬', color: '#d4800c' },
          { label: 'In Progress',   val: stats.inProgress, icon: '⚙️', color: '#1d6fa4' },
          { label: 'Resolved',      val: stats.resolved,   icon: '✅', color: '#16a34a' },
        ].map(s => (
          <div key={s.label} className="card card-hover p-5">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-3xl font-bold" style={{ color: s.color }}>{s.val}</div>
            <div className="text-xs text-gray-500 font-medium mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Offices */}
      <h2 className="text-lg font-bold text-gray-800 mb-4">Available Offices</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offices.map(office => (
          <div
            key={office.id}
            onClick={() => handleOfficeClick(office)}
            className={`card flex items-start gap-4 p-5 border-2 border-transparent
              ${office.comingSoon
                ? 'opacity-60 cursor-not-allowed'
                : 'cursor-pointer card-hover hover:border-green-200'
              }`}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: office.comingSoon ? '#f3f4f6' : '#e8f5f1' }}
            >
              {office.icon}
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-800 flex items-center gap-2">
                {office.name}
                {office.comingSoon && (
                  <span className="text-xs px-2 py-0.5 rounded font-semibold"
                    style={{ background: '#fef3c7', color: '#92400e' }}>
                    Coming Soon
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{office.description}</p>
              {!office.comingSoon && (
                <p className="text-xs font-semibold mt-2" style={{ color: '#0B4E3D' }}>
                  Select →
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}