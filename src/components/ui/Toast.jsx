// src/components/ui/Toast.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ToastContext = createContext(null)

const ICONS = {
  success: '✅',
  error:   '❌',
  warning: '⚠️',
  info:    '💬',
}

const COLORS = {
  success: { bg: '#f0fdf4', border: '#86efac', title: '#166534', bar: '#22c55e' },
  error:   { bg: '#fef2f2', border: '#fca5a5', title: '#991b1b', bar: '#ef4444' },
  warning: { bg: '#fffbeb', border: '#fcd34d', title: '#92400e', bar: '#f59e0b' },
  info:    { bg: '#eff6ff', border: '#93c5fd', title: '#1e40af', bar: '#3b82f6' },
}

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++_id
    setToasts(prev => [...prev, { id, message, type, duration }])
    return id
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Convenience helpers
  const success = useCallback((msg, dur) => toast(msg, 'success', dur), [toast])
  const error   = useCallback((msg, dur) => toast(msg, 'error',   dur), [toast])
  const warning = useCallback((msg, dur) => toast(msg, 'warning', dur), [toast])
  const info    = useCallback((msg, dur) => toast(msg, 'info',    dur), [toast])

  return (
    <ToastContext.Provider value={{ toast, dismiss, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null
  return (
    <div
      className="fixed z-[9999] flex flex-col gap-2 pointer-events-none"
      style={{ bottom: 24, right: 24, maxWidth: 360, width: '100%' }}
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false)
  const c = COLORS[toast.type] || COLORS.info

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setVisible(true), 10)
    // Auto-dismiss
    const hideTimer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(toast.id), 300)
    }, toast.duration)
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer) }
  }, [toast.id, toast.duration, onDismiss])

  return (
    <div
      className="pointer-events-auto rounded-xl shadow-xl overflow-hidden"
      style={{
        background:   c.bg,
        border:       `1px solid ${c.border}`,
        transform:    visible ? 'translateX(0)' : 'translateX(110%)',
        opacity:      visible ? 1 : 0,
        transition:   'transform 0.3s cubic-bezier(.21,1.02,.73,1), opacity 0.3s ease',
      }}
    >
      {/* Progress bar */}
      <div
        style={{
          height: 3,
          background: c.bar,
          transformOrigin: 'left',
          animation: visible ? `toastBar ${toast.duration}ms linear forwards` : 'none',
        }}
      />
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="text-xl flex-shrink-0 mt-0.5">{ICONS[toast.type]}</span>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-snug"
            style={{ color: c.title }}
          >
            {toast.message}
          </p>
        </div>
        <button
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none mt-0.5"
          onClick={() => { setVisible(false); setTimeout(() => onDismiss(toast.id), 300) }}
        >
          ×
        </button>
      </div>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}