import { useNavigate, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'Home',          path: '/' },
  { label: 'Submit a Ticket', path: '/submit' },
  { label: 'Track Ticket',  path: '/track' },
]

export default function PublicHeader() {
  const navigate  = useNavigate()
  const { pathname } = useLocation()

  return (
    <header className="shadow-lg" style={{ background: '#0B4E3D' }}>
      {/* Top bar */}
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 text-left"
        >
          {/* <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: '#FFC107' }}
          >
            🎓
          </div> */}

          <div
  className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 overflow-hidden"
  style={{ background: '#FFC107' }}
>
  <img
    src="/sample_img.jpg"
    alt="Me"
    className="w-full h-full object-cover"
  />
</div>

          <div>
            <div className="font-serif text-white text-lg leading-tight">
              DepEd Zamboanga Sibugay
            </div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Division Helpdesk &amp; Ticketing System
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          <button
            className="btn-secondary text-xs py-2 px-4"
            style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.35)', color: 'white' }}
            onClick={() => navigate('/track')}
          >
            🔍 Track Ticket
          </button>
          <button
            className="btn-gold text-xs py-2 px-4"
            onClick={() => navigate('/admin/login')}
          >
            Admin →
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-4 pb-3 flex gap-6">
        {NAV_LINKS.map(link => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={`nav-link text-xs font-semibold pb-1 transition-colors ${
              pathname === link.path ? 'active text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            {link.label}
          </button>
        ))}
      </nav>
    </header>
  )
}