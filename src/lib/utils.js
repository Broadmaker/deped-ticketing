export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatDateShort(iso) {
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export const STATUS_CONFIG = {
  'open':        { label: '● Open',        className: 'badge badge-open' },
  'in-progress': { label: '● In Progress', className: 'badge badge-progress' },
  'resolved':    { label: '✓ Resolved',    className: 'badge badge-resolved' },
  'closed':      { label: '✕ Closed',      className: 'badge badge-closed' },
}

export const PRIORITY_CONFIG = {
  high:   { label: '▲ High',   className: 'text-xs font-semibold text-red-600' },
  medium: { label: '◆ Medium', className: 'text-xs font-semibold text-amber-600' },
  low:    { label: '▼ Low',    className: 'text-xs font-semibold text-green-600' },
}