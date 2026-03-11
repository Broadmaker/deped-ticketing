import { useState } from 'react'
import { useToast } from '../../components/ui/Toast.jsx'
import { useUsers, ROLES, PERMISSION_LABELS } from '../../context/useUsers.jsx'
import { useOffices } from '../../context/useOffices.jsx'
import { useAuth } from '../../context/useAuth.jsx'
import { formatDate } from '../../lib/utils.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const r = ROLES[role]
  if (!r) return null
  return (
    <span
      className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
      style={{ background: r.bg, color: r.color }}
    >
      {r.label}
    </span>
  )
}

function StatusDot({ status }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium"
      style={{ color: status === 'active' ? '#16a34a' : '#9ca3af' }}>
      <span className="w-2 h-2 rounded-full inline-block"
        style={{ background: status === 'active' ? '#16a34a' : '#d1d5db' }} />
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  )
}

function Avatar({ name, role, size = 10 }) {
  const r = ROLES[role]
  const initials = name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{
        background: r?.color || '#6b7280',
        fontSize: size <= 8 ? 11 : 14,
        width: size * 4, height: size * 4,
      }}
    >
      {initials}
    </div>
  )
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-2xl shadow-2xl w-full animate-fadeUp overflow-hidden ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 text-xl leading-none">
            ×
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  )
}

// ─── User Form ────────────────────────────────────────────────────────────────
function UserForm({ initial = {}, onSave, onClose, offices, currentUserId }) {
  const isEdit = !!initial.id
  const isSelf = initial.id === currentUserId

  const [form, setForm] = useState({
    name:     initial.name     || '',
    email:    initial.email    || '',
    username: initial.username || '',
    password: initial.password || '',
    role:     initial.role     || 'staff',
    officeId: initial.officeId || '',
    status:   initial.status   || 'active',
  })
  const [showPass, setShowPass] = useState(false)
  const [errors,   setErrors]   = useState({})

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  const activeOffices = offices.filter(o => !o.comingSoon)

  function validate() {
    const e = {}
    if (!form.name.trim())     e.name     = 'Full name is required.'
    if (!form.email.trim())    e.email    = 'Email is required.'
    if (!form.username.trim()) e.username = 'Username is required.'
    if (!isEdit && !form.password.trim()) e.password = 'Password is required.'
    if (form.role !== 'superadmin' && !form.officeId) e.officeId = 'Please select an office.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const selectedOffice = activeOffices.find(o => o.id === form.officeId)
    onSave({
      ...form,
      office: form.role === 'superadmin' ? 'All Offices' : (selectedOffice?.name || ''),
      officeId: form.role === 'superadmin' ? null : form.officeId,
      ...(isEdit && !form.password ? { password: initial.password } : {}),
    })
    onClose()
  }

  return (
    <div className="space-y-4">
      {/* Name + Email */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name *</label>
          <input className="input-field" placeholder="Juan dela Cruz" value={form.name} onChange={set('name')} />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Email *</label>
          <input className="input-field" type="email" placeholder="juan@deped-zamsib.gov.ph"
            value={form.email} onChange={set('email')} />
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
        </div>
      </div>

      {/* Username + Password */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Username *</label>
          <input className="input-field" placeholder="jdelacruz" value={form.username}
            onChange={set('username')} autoComplete="off" />
          {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Password {isEdit && <span className="text-gray-400 font-normal">(leave blank to keep)</span>}
          </label>
          <div className="relative">
            <input
              className="input-field pr-10"
              type={showPass ? 'text' : 'password'}
              placeholder={isEdit ? '••••••••' : 'Set password'}
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
            />
            <button type="button" tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
              onClick={() => setShowPass(s => !s)}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
        </div>
      </div>

      {/* Role */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Role *</label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(ROLES).map(([key, r]) => (
            <button
              key={key}
              type="button"
              disabled={isSelf && key !== form.role}
              onClick={() => setForm(f => ({ ...f, role: key, officeId: key === 'superadmin' ? '' : f.officeId }))}
              className="p-3 rounded-xl text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                border: `2px solid ${form.role === key ? r.color : '#e5e7eb'}`,
                background: form.role === key ? r.bg : 'white',
              }}
            >
              <div className="text-xs font-bold" style={{ color: r.color }}>{r.label}</div>
              <div className="text-xs text-gray-400 mt-0.5 leading-tight">{r.desc.slice(0, 40)}…</div>
            </button>
          ))}
        </div>
        {isSelf && <p className="text-xs text-amber-600 mt-1">⚠ You cannot change your own role.</p>}
      </div>

      {/* Office (hidden for superadmin) */}
      {form.role !== 'superadmin' && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Office *</label>
          <select className="input-field" value={form.officeId} onChange={set('officeId')}
            style={{ padding: '8px 12px' }}>
            <option value="">— Select an office —</option>
            {activeOffices.map(o => (
              <option key={o.id} value={o.id}>{o.icon} {o.name}</option>
            ))}
          </select>
          {errors.officeId && <p className="text-xs text-red-500 mt-1">{errors.officeId}</p>}
          {activeOffices.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">No active offices yet. Activate one in Offices & Services first.</p>
          )}
        </div>
      )}

      {/* Status */}
      {isEdit && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-2">Account Status</label>
          <div className="flex gap-3">
            {['active', 'inactive'].map(s => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="status" value={s} checked={form.status === s}
                  onChange={set('status')} className="accent-green-700"
                  disabled={isSelf && s === 'inactive'} />
                <span className="text-sm capitalize font-medium text-gray-700">{s}</span>
              </label>
            ))}
          </div>
          {isSelf && <p className="text-xs text-amber-600 mt-1">⚠ You cannot deactivate your own account.</p>}
        </div>
      )}

      <div className="flex gap-3 pt-2 border-t border-gray-100">
        <button className="btn-secondary flex-1 text-sm py-2" onClick={onClose}>Cancel</button>
        <button className="btn-primary flex-1 text-sm py-2" onClick={handleSave}>
          {isEdit ? 'Save Changes' : 'Create User'}
        </button>
      </div>
    </div>
  )
}

// ─── Permission Matrix Modal ───────────────────────────────────────────────────
function PermissionsModal({ onClose }) {
  const allPerms = Object.keys(PERMISSION_LABELS)
  return (
    <Modal title="Role Permissions Matrix" onClose={onClose} wide>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left py-2 pr-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2">
                Permission
              </th>
              {Object.entries(ROLES).map(([key, r]) => (
                <th key={key} className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider"
                  style={{ color: r.color }}>
                  {r.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {allPerms.map(perm => (
              <tr key={perm}>
                <td className="py-2.5 pr-4 text-gray-700 text-xs">{PERMISSION_LABELS[perm]}</td>
                {Object.entries(ROLES).map(([key, r]) => (
                  <td key={key} className="py-2.5 px-3 text-center">
                    {r.permissions.includes(perm)
                      ? <span className="text-green-600 text-base">✓</span>
                      : <span className="text-gray-200 text-base">✕</span>
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}

// ─── Confirm modal ─────────────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onClose, danger = false }) {
  return (
    <Modal title="Confirm Action" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-5">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary text-sm py-2 px-4" onClick={onClose}>Cancel</button>
        <button
          className="text-sm py-2 px-4 rounded-lg font-semibold text-white"
          style={{ background: danger ? '#dc2626' : '#0B4E3D' }}
          onClick={() => { onConfirm(); onClose() }}
        >
          Confirm
        </button>
      </div>
    </Modal>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminUsers() {
  const { users, addUser, updateUser, toggleStatus, deleteUser } = useUsers()
  const toast = useToast()
  const { offices } = useOffices()
  const { currentUser } = useAuth()

  const [search,     setSearch]     = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterOffice, setFilterOffice] = useState('all')

  const [modal,   setModal]   = useState(null)  // null | 'add' | 'edit' | 'perms' | 'confirm-status' | 'confirm-delete'
  const [target,  setTarget]  = useState(null)

  const filtered = users.filter(u => {
    if (filterRole   !== 'all' && u.role     !== filterRole)   return false
    if (filterOffice !== 'all' && u.officeId !== filterOffice && !(filterOffice === 'all_offices' && !u.officeId)) return false
    const q = search.toLowerCase()
    if (q && !(
      u.name.toLowerCase().includes(q)     ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)    ||
      (u.office || '').toLowerCase().includes(q)
    )) return false
    return true
  })

  // Stats
  const stats = {
    total:    users.length,
    active:   users.filter(u => u.status === 'active').length,
    inactive: users.filter(u => u.status === 'inactive').length,
  }

  const roleStats = Object.keys(ROLES).map(r => ({
    key:   r,
    label: ROLES[r].label,
    color: ROLES[r].color,
    bg:    ROLES[r].bg,
    count: users.filter(u => u.role === r).length,
  }))

  const activeOffices = offices.filter(o => !o.comingSoon)

  return (
    <div className="p-6 animate-fadeUp space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">User Management</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage system accounts, roles, and office assignments.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary text-sm flex items-center gap-2"
            onClick={() => setModal('perms')}
          >
            🔐 Permissions
          </button>
          <button
            className="btn-primary text-sm flex items-center gap-2"
            onClick={() => { setTarget(null); setModal('add') }}
          >
            + Add User
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="card p-4">
          <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          <div className="text-xs text-gray-400 mt-1">Total Users</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold" style={{ color: '#16a34a' }}>{stats.active}</div>
          <div className="text-xs text-gray-400 mt-1">Active</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-bold text-gray-400">{stats.inactive}</div>
          <div className="text-xs text-gray-400 mt-1">Inactive</div>
        </div>
        {roleStats.map(r => (
          <div key={r.key} className="card p-4">
            <div className="text-2xl font-bold" style={{ color: r.color }}>{r.count}</div>
            <div className="text-xs text-gray-400 mt-1">{r.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-52">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            className="input-field pl-8"
            placeholder="Search name, username, email, office..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '8px 12px 8px 32px' }}
          />
        </div>
        <select className="input-field w-auto text-sm" value={filterRole}
          onChange={e => setFilterRole(e.target.value)} style={{ padding: '8px 12px' }}>
          <option value="all">All Roles</option>
          {Object.entries(ROLES).map(([k, r]) => (
            <option key={k} value={k}>{r.label}</option>
          ))}
        </select>
        <select className="input-field w-auto text-sm" value={filterOffice}
          onChange={e => setFilterOffice(e.target.value)} style={{ padding: '8px 12px' }}>
          <option value="all">All Offices</option>
          <option value="all_offices">All Offices (Super Admin)</option>
          {activeOffices.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <div className="text-xs text-gray-400 ml-auto">
          {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#f8faf9', borderBottom: '2px solid #e5e7eb' }}>
              {['User', 'Username', 'Role', 'Office', 'Status', 'Created', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center text-gray-400">
                  <div className="text-3xl mb-2">👤</div>
                  No users match your search.
                </td>
              </tr>
            ) : filtered.map(u => (
              <tr
                key={u.id}
                className="transition-colors"
                onMouseEnter={e => e.currentTarget.style.background = '#f8faf9'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                {/* User */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} role={u.role} size={9} />
                    <div>
                      <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                        {u.name}
                        {u.id === currentUser?.id && (
                          <span className="text-xs px-1.5 py-0.5 rounded font-semibold"
                            style={{ background: '#fef9e7', color: '#d4800c' }}>You</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </div>
                  </div>
                </td>

                {/* Username */}
                <td className="px-5 py-3">
                  <span className="font-mono text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {u.username}
                  </span>
                </td>

                {/* Role */}
                <td className="px-5 py-3">
                  <RoleBadge role={u.role} />
                </td>

                {/* Office */}
                <td className="px-5 py-3 text-sm text-gray-600">
                  {u.officeId
                    ? <span className="flex items-center gap-1">
                        <span>{offices.find(o => o.id === u.officeId)?.icon}</span>
                        {u.office}
                      </span>
                    : <span className="text-gray-400 text-xs italic">All Offices</span>
                  }
                </td>

                {/* Status */}
                <td className="px-5 py-3">
                  <StatusDot status={u.status} />
                </td>

                {/* Created */}
                <td className="px-5 py-3 text-xs text-gray-400 whitespace-nowrap">
                  {formatDate(u.createdAt)}
                </td>

                {/* Actions */}
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { setTarget(u); setModal('edit') }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                      style={{ background: '#e8f5f1', color: '#0B4E3D' }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => { setTarget(u); setModal('confirm-status') }}
                      disabled={u.id === currentUser?.id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      style={u.status === 'active'
                        ? { background: '#fef3c7', color: '#92400e' }
                        : { background: '#dcfce7', color: '#166534' }
                      }
                    >
                      {u.status === 'active' ? '⏸' : '▶'}
                    </button>
                    <button
                      onClick={() => { setTarget(u); setModal('confirm-delete') }}
                      disabled={u.id === currentUser?.id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      style={{ background: '#fef2f2', color: '#dc2626' }}
                    >
                      🗑
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Role cards ── */}
      <div className="grid md:grid-cols-3 gap-4">
        {Object.entries(ROLES).map(([key, r]) => (
          <div key={key} className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-bold" style={{ color: r.color }}>{r.label}</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: r.bg, color: r.color }}>
                {users.filter(u => u.role === key).length} user{users.filter(u => u.role === key).length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">{r.desc}</p>
            <div className="space-y-1">
              {Object.keys(PERMISSION_LABELS).map(perm => (
                <div key={perm} className="flex items-center gap-2 text-xs">
                  <span style={{ color: r.permissions.includes(perm) ? '#16a34a' : '#d1d5db' }}>
                    {r.permissions.includes(perm) ? '✓' : '✕'}
                  </span>
                  <span style={{ color: r.permissions.includes(perm) ? '#374151' : '#9ca3af' }}>
                    {PERMISSION_LABELS[perm]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Modals ── */}
      {modal === 'add' && (
        <Modal title="Add New User" onClose={() => setModal(null)} wide>
          <UserForm
            offices={offices}
            currentUserId={currentUser?.id}
            onSave={async data => {
                try {
                  await addUser(data)
                  toast.success('User added successfully.')
                  setModal(null)
                } catch (err) {
                  toast.error(err.message || 'Failed to add user.')
                }
              }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal === 'edit' && target && (
        <Modal title="Edit User" onClose={() => setModal(null)} wide>
          <UserForm
            initial={target}
            offices={offices}
            currentUserId={currentUser?.id}
            onSave={async data => {
                try {
                  await updateUser(target.id, data)
                  toast.success('User updated successfully.')
                  setModal(null)
                } catch (err) {
                  toast.error(err.message || 'Failed to update user.')
                }
              }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal === 'perms' && (
        <PermissionsModal onClose={() => setModal(null)} />
      )}

      {modal === 'confirm-status' && target && (
        <ConfirmModal
          message={`${target.status === 'active' ? 'Deactivate' : 'Activate'} account for "${target.name}"? ${target.status === 'active' ? 'They will no longer be able to log in.' : 'They will be able to log in again.'}`}
          onConfirm={async () => {
              try {
                const newStatus = await toggleStatus(target.id)
                toast.info(newStatus === 'active' ? `${target.name} activated.` : `${target.name} deactivated.`)
                setModal(null)
              } catch (err) {
                toast.error(err.message || 'Failed to update status.')
              }
            }}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'confirm-delete' && target && (
        <ConfirmModal
          message={`Permanently delete "${target.name}"? This cannot be undone.`}
          onConfirm={async () => {
              try {
                await deleteUser(target.id)
                toast.error(`${target.name} has been deleted.`)
                setModal(null)
              } catch (err) {
                toast.error(err.message || 'Failed to delete user.')
              }
            }}
          onClose={() => setModal(null)}
          danger
        />
      )}

    </div>
  )
}