// src/pages/public/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.jsx'
import { ROLES } from '../../context/useUsers.jsx'
import { useToast } from '../../components/ui/Toast.jsx'

const DEMO_ACCOUNTS = [
  { name: 'System Administrator', username: 'admin',     password: 'admin123', role: 'superadmin'   },
  { name: 'Ricardo Villanueva',   username: 'ict.admin', password: 'ict2025',  role: 'office_admin' },
  { name: 'Juan dela Cruz',       username: 'jdelacruz', password: 'staff123', role: 'staff'        },
  { name: 'Ana Reyes',            username: 'areyes',    password: 'staff123', role: 'staff'        },
]

export default function LoginPage() {
  const { login, loginError, setLoginError } = useAuth()
  const navigate = useNavigate()
  const toast    = useToast()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const ok = await login(username, password)
    setLoading(false)
    if (ok) {
      toast.success('Welcome back!')
      navigate('/admin')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0B4E3D 0%, #0d6b54 50%, #094434 100%)' }}
    >
      <div className="absolute inset-0 hero-pattern opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-md animate-fadeUp">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-xl"
            style={{ background: '#FFC107' }}
          >
            🎓
          </div>
          <div className="font-serif text-white text-2xl leading-tight">
            DepEd Zamboanga Sibugay
          </div>
          <div className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Helpdesk &amp; Ticketing System — Staff Portal
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 py-8">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Sign In</h2>
            <p className="text-sm text-gray-500 mb-6">Enter your credentials to continue.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Username</label>
                <input
                  className="input-field"
                  placeholder="username"
                  value={username}
                  onChange={e => { setUsername(e.target.value); setLoginError('') }}
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
                <div className="relative">
                  <input
                    className="input-field pr-10"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setLoginError('') }}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                    onClick={() => setShowPass(s => !s)}
                    tabIndex={-1}
                  >
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {loginError && (
                <div
                  className="text-sm px-4 py-3 rounded-lg"
                  style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}
                >
                  ⚠️ {loginError}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
                disabled={loading || !username || !password}
              >
                {loading
                  ? <><span className="animate-spin inline-block">⏳</span> Signing in...</>
                  : '→ Sign In'
                }
              </button>
            </form>
          </div>

          {/* Demo accounts */}
          <div className="px-8 py-5" style={{ background: '#f8faf9', borderTop: '1px solid #e5e7eb' }}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Demo Accounts
            </p>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map(u => {
                const role = ROLES[u.role]
                return (
                  <button
                    key={u.username}
                    type="button"
                    onClick={() => { setUsername(u.username); setPassword(u.password); setLoginError('') }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-white"
                    style={{ border: '1px solid #e5e7eb' }}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: role?.color || '#666' }}
                    >
                      {u.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-gray-700 truncate">{u.name}</div>
                      <div className="text-xs text-gray-400">{u.username} · {u.password}</div>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                      style={{ background: role?.bg, color: role?.color }}
                    >
                      {role?.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            className="text-sm transition-colors"
            style={{ color: 'rgba(255,255,255,0.55)' }}
            onClick={() => navigate('/')}
            onMouseOver={e => e.currentTarget.style.color = 'white'}
            onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.55)'}
          >
            ← Back to Public Portal
          </button>
        </div>
      </div>
    </div>
  )
}