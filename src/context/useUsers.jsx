// src/context/useUsers.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api.js'
import { useAuth } from './useAuth.jsx'

// ─── Role definitions (UI only — permissions enforced on backend) ─────────────
export const ROLES = {
  superadmin: {
    label: 'Super Admin',
    color: '#0B4E3D',
    bg:    '#e8f5f1',
    desc:  'Full system access. Manages users, offices, and all tickets.',
    permissions: [
      'view_all_tickets', 'view_office_tickets', 'reply_tickets',
      'change_status', 'close_tickets', 'assign_tickets',
      'view_dashboard', 'manage_users', 'manage_offices', 'access_settings',
    ],
  },
  office_admin: {
    label: 'Office Admin',
    color: '#1d6fa4',
    bg:    '#e8f4fd',
    desc:  'Manages tickets for their assigned office.',
    permissions: [
      'view_office_tickets', 'reply_tickets',
      'change_status', 'close_tickets', 'assign_tickets', 'view_dashboard',
    ],
  },
  staff: {
    label: 'Staff',
    color: '#7c3aed',
    bg:    '#f3f0ff',
    desc:  'Handles tickets for their office.',
    permissions: [
      'view_office_tickets', 'reply_tickets',
      'change_status', 'assign_tickets', 'view_dashboard',
    ],
  },
}

export const PERMISSION_LABELS = {
  view_all_tickets:    'View all offices\' tickets',
  view_office_tickets: 'View own office\'s tickets',
  reply_tickets:       'Reply to tickets',
  change_status:       'Change status (In Progress / Resolved)',
  close_tickets:       'Close / Reopen tickets',
  assign_tickets:      'Assign tickets to others',
  view_dashboard:      'View dashboard & reports',
  manage_users:        'Manage users',
  manage_offices:      'Manage offices & services',
  access_settings:     'Access system settings',
}

const UsersContext = createContext(null)

export function UsersProvider({ children }) {
  const { currentUser } = useAuth()
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(false)

  const fetchUsers = useCallback(async () => {
    if (!currentUser || !['superadmin', 'office_admin'].includes(currentUser.role)) return
    setLoading(true)
    try {
      const data = await api.get('/users')
      setUsers(data)
    } catch (_) {
      // non-superadmin won't have access — that's fine
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  async function addUser(data) {
    const user = await api.post('/users', {
      username:  data.username,
      password:  data.password,
      name:      data.name,
      email:     data.email,
      role:      data.role,
      office_id: data.role === 'superadmin' ? null : data.officeId,
    })
    await fetchUsers()
    return user
  }

  async function updateUser(id, data) {
    await api.patch(`/users/${id}`, {
      username:  data.username,
      name:      data.name,
      email:     data.email,
      role:      data.role,
      office_id: data.role === 'superadmin' ? null : data.officeId,
      status:    data.status,
      ...(data.password ? { password: data.password } : {}),
    })
    await fetchUsers()
  }

  async function toggleStatus(id) {
    const res = await api.patch(`/users/${id}/toggle-status`)
    await fetchUsers()
    return res.status
  }

  async function deleteUser(id) {
    await api.delete(`/users/${id}`)
    await fetchUsers()
  }

  function getUserById(id) {
    return users.find(u => u.id === id) || null
  }

  function getAssignableUsers(officeId) {
    return users.filter(u =>
      u.status === 'active' &&
      (u.role === 'superadmin' || u.office_id === officeId)
    )
  }

  return (
    <UsersContext.Provider value={{
      users, loading, fetchUsers,
      addUser, updateUser, toggleStatus, deleteUser,
      getUserById, getAssignableUsers,
    }}>
      {children}
    </UsersContext.Provider>
  )
}

export function useUsers() {
  const ctx = useContext(UsersContext)
  if (!ctx) throw new Error('useUsers must be used within UsersProvider')
  return ctx
}