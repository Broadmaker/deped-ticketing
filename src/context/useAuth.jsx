// src/context/useAuth.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api.js'
import { ROLES } from './useUsers.jsx'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loginError,  setLoginError]  = useState('')
  const [loading,     setLoading]     = useState(true)  // checking stored token

  // On mount — restore session from stored token
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (!token) { setLoading(false); return }
    api.get('/auth/me')
      .then(user => setCurrentUser(user))
      .catch(() => localStorage.removeItem('auth_token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(username, password) {
    setLoginError('')
    try {
      const { token, user } = await api.post('/auth/login', { username, password })
      localStorage.setItem('auth_token', token)
      setCurrentUser(user)
      return true
    } catch (err) {
      setLoginError(err.message || 'Invalid username or password.')
      return false
    }
  }

  function logout() {
    localStorage.removeItem('auth_token')
    setCurrentUser(null)
  }

  function can(permission) {
    if (!currentUser) return false
    return (ROLES[currentUser.role]?.permissions || []).includes(permission)
  }

  const isSuperAdmin  = currentUser?.role === 'superadmin'
  const isOfficeAdmin = currentUser?.role === 'office_admin' || isSuperAdmin

  return (
    <AuthContext.Provider value={{
      currentUser, loading,
      login, logout, loginError, setLoginError,
      can, isSuperAdmin, isOfficeAdmin,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}