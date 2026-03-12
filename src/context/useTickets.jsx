// src/context/useTickets.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api.js'
import { useAuth } from './useAuth.jsx'

const TicketContext = createContext(null)

export function TicketProvider({ children }) {
  const { currentUser } = useAuth()
  const [tickets,  setTickets]  = useState([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  // Fetch all tickets (called on mount and after mutations)
  const fetchTickets = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/tickets?limit=200')
      setTickets(res.tickets || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  // ── Mutations ─────────────────────────────────────────────────────────────

  async function addTicket(data) {
    const payload = {
      office_id:        data.officeId,
      service_id:       data.service,
      submitter_name:   data.name,
      submitter_email:  data.email,
      submitter_phone:  data.phone || null,
      submitter_school: data.school,
      subject:          data.subject,
      concern:          data.concern,
    }
    // Debug: log payload so we can see what's being sent
    console.log('[addTicket] payload:', payload)
    const res = await api.post('/tickets', payload)
    return res  // { id, message }
  }

  async function updateStatus(id, status) {
    await api.patch(`/tickets/${id}`, { status })
    await fetchTickets()
  }

  async function assignTicket(id, assigned_to_id) {
    await api.patch(`/tickets/${id}`, { assigned_to_id: assigned_to_id || null })
    await fetchTickets()
  }

  async function addReply(id, message) {
    const reply = await api.post(`/tickets/${id}/replies`, { message })
    await fetchTickets()
    return reply
  }

  async function saveResolution(id, resolution) {
    await api.patch(`/tickets/${id}`, { resolution })
    await fetchTickets()
  }

  async function updatePriority(id, priority) {
    await api.patch(`/tickets/${id}`, { priority })
    await fetchTickets()
  }

  // Full ticket detail (includes replies + activity_log)
  async function getTicketDetail(id) {
    return api.get(`/tickets/${id}`)
  }

  // Stats for dashboard
  async function getStats() {
    return api.get('/tickets/stats')
  }

  function getTicketById(id) {
    return tickets.find(t => t.id === id) || null
  }

  return (
    <TicketContext.Provider value={{
      tickets, loading, error,
      fetchTickets,
      addTicket, updateStatus, assignTicket,
      addReply, saveResolution, updatePriority,
      getTicketById, getTicketDetail, getStats,
    }}>
      {children}
    </TicketContext.Provider>
  )
}

export function useTickets() {
  const ctx = useContext(TicketContext)
  if (!ctx) throw new Error('useTickets must be used within TicketProvider')
  return ctx
}