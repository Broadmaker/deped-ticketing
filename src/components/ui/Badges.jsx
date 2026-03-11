import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../lib/utils.js'

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['open']
  return <span className={cfg.className}>{cfg.label}</span>
}

export function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG['medium']
  return <span className={cfg.className}>{cfg.label}</span>
}