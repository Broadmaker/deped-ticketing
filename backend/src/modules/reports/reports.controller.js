// src/modules/reports/reports.controller.js
import pool from '../../config/db.js'
import { asyncHandler } from '../../middleware/errorHandler.js'

export const getSummary = asyncHandler(async (req, res) => {
  const me = req.user
  const { range, date_from, date_to } = req.query

  // ── Date range ────────────────────────────────────────────────────────
  let dateFrom, dateTo

  if (range === 'custom' && date_from && date_to) {
    dateFrom = `${date_from} 00:00:00`
    dateTo   = `${date_to} 23:59:59`
  } else {
    const days  = range === '90d' ? 90 : range === '30d' ? 30 : 7
    const now   = new Date()
    const start = new Date(now - days * 86400000)
    dateFrom = start.toISOString().slice(0, 19).replace('T', ' ')
    dateTo   = now.toISOString().slice(0, 19).replace('T', ' ')
  }

  const officeWhere = me.role !== 'superadmin' ? `AND t.office_id = ?` : ''
  const officeVal   = me.role !== 'superadmin' ? [me.office_id] : []

  // Base params reused across queries: [dateFrom, dateTo, ...officeVal]
  const baseParams = [dateFrom, dateTo, ...officeVal]
  const baseWhere  = `t.created_at BETWEEN ? AND ? ${officeWhere}`

  // ── KPI counts ────────────────────────────────────────────────────────
  const [[kpi]] = await pool.query(`
    SELECT
      COUNT(*)                                                         AS total,
      SUM(CASE WHEN status = 'open'        THEN 1 ELSE 0 END)         AS open_count,
      SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END)         AS in_progress,
      SUM(CASE WHEN status = 'resolved'    THEN 1 ELSE 0 END)         AS resolved_count,
      SUM(CASE WHEN status = 'closed'      THEN 1 ELSE 0 END)         AS closed_count,
      SUM(CASE WHEN assigned_to_id IS NULL THEN 1 ELSE 0 END)         AS unassigned,
      SUM(CASE WHEN status IN ('resolved','closed') THEN 1 ELSE 0 END) AS done_count,
      ROUND(AVG(CASE WHEN status IN ('resolved','closed')
        THEN TIMESTAMPDIFF(MINUTE, created_at, updated_at) / 60.0 END), 2) AS avg_hrs,
      MIN(CASE WHEN status IN ('resolved','closed')
        THEN TIMESTAMPDIFF(MINUTE, created_at, updated_at) / 60.0 END)     AS min_hrs,
      MAX(CASE WHEN status IN ('resolved','closed')
        THEN TIMESTAMPDIFF(MINUTE, created_at, updated_at) / 60.0 END)     AS max_hrs
    FROM tickets t WHERE ${baseWhere}
  `, baseParams)

  // ── By status ─────────────────────────────────────────────────────────
  const [byStatus] = await pool.query(`
    SELECT status, COUNT(*) AS count
    FROM tickets t WHERE ${baseWhere}
    GROUP BY status
  `, baseParams)

  // ── By priority ───────────────────────────────────────────────────────
  const [byPriority] = await pool.query(`
    SELECT priority, COUNT(*) AS count
    FROM tickets t WHERE ${baseWhere}
    GROUP BY priority
  `, baseParams)

  // ── By office ─────────────────────────────────────────────────────────
  const [byOffice] = await pool.query(`
    SELECT o.name AS office_name, COUNT(t.id) AS count
    FROM tickets t
    JOIN offices o ON o.id = t.office_id
    WHERE ${baseWhere}
    GROUP BY o.id, o.name
    ORDER BY count DESC
    LIMIT 10
  `, baseParams)

  // ── Top services ──────────────────────────────────────────────────────
  const [byService] = await pool.query(`
    SELECT s.label AS service, o.name AS office, COUNT(t.id) AS count
    FROM tickets t
    JOIN services s ON s.id = t.service_id
    JOIN offices  o ON o.id = t.office_id
    WHERE ${baseWhere}
    GROUP BY s.id, s.label, o.name
    ORDER BY count DESC
    LIMIT 10
  `, baseParams)

  // ── Peak hours (PH time UTC+8) ────────────────────────────────────────
  const [peakHours] = await pool.query(`
    SELECT HOUR(CONVERT_TZ(t.created_at, '+00:00', '+08:00')) AS hour,
           COUNT(*) AS count
    FROM tickets t WHERE ${baseWhere}
    GROUP BY hour ORDER BY hour
  `, baseParams)

  // ── Peak days (0=Sun … 6=Sat) ─────────────────────────────────────────
  const [peakDays] = await pool.query(`
    SELECT DAYOFWEEK(CONVERT_TZ(t.created_at, '+00:00', '+08:00')) - 1 AS dow,
           COUNT(*) AS count
    FROM tickets t WHERE ${baseWhere}
    GROUP BY dow ORDER BY dow
  `, baseParams)

  // ── Staff performance ─────────────────────────────────────────────────
  const staffOfficeWhere = me.role !== 'superadmin' ? `AND u.office_id = ?` : ''
  const staffParams = [...baseParams, ...(me.role !== 'superadmin' ? [me.office_id] : [])]

  const [staffPerf] = await pool.query(`
    SELECT u.id, u.name, u.avatar, u.role, o.name AS office,
      COUNT(t.id) AS total_assigned,
      SUM(CASE WHEN t.status IN ('open','in-progress') THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN t.status IN ('resolved','closed') THEN 1 ELSE 0 END) AS resolved,
      ROUND(AVG(CASE WHEN t.status IN ('resolved','closed')
        THEN TIMESTAMPDIFF(MINUTE, t.created_at, t.updated_at) / 60.0 END), 2) AS avg_resolution_hrs
    FROM users u
    LEFT JOIN offices o ON o.id = u.office_id
    LEFT JOIN tickets t
      ON t.assigned_to_id = u.id
      AND t.created_at BETWEEN ? AND ?
      ${me.role !== 'superadmin' ? `AND t.office_id = ?` : ''}
    WHERE u.role IN ('office_admin','staff') ${staffOfficeWhere}
    GROUP BY u.id, u.name, u.avatar, u.role, o.name
    ORDER BY total_assigned DESC
  `, staffParams)

  res.json({
    range: { from: dateFrom.slice(0, 10), to: dateTo.slice(0, 10) },
    totals: {
      total:       Number(kpi.total        || 0),
      open:        Number(kpi.open_count   || 0),
      in_progress: Number(kpi.in_progress  || 0),
      resolved:    Number(kpi.resolved_count || 0),
      closed:      Number(kpi.closed_count || 0),
      unassigned:  Number(kpi.unassigned   || 0),
    },
    resolution: {
      resolved_count: Number(kpi.done_count || 0),
      avg_hours: kpi.avg_hrs ? Number(kpi.avg_hrs) : null,
      min_hours: kpi.min_hrs ? Number(kpi.min_hrs) : null,
      max_hours: kpi.max_hrs ? Number(kpi.max_hrs) : null,
    },
    by_status:   byStatus.map(r  => ({ ...r, count: Number(r.count) })),
    by_priority: byPriority.map(r => ({ ...r, count: Number(r.count) })),
    by_office:   byOffice.map(r  => ({ ...r, count: Number(r.count) })),
    by_service:  byService.map(r => ({ ...r, count: Number(r.count) })),
    peak_hours:  peakHours.map(r => ({ hour: Number(r.hour), count: Number(r.count) })),
    peak_days:   peakDays.map(r  => ({ dow:  Number(r.dow),  count: Number(r.count) })),
    staff:       staffPerf.map(r => ({
      ...r,
      total_assigned:    Number(r.total_assigned || 0),
      active:            Number(r.active         || 0),
      resolved:          Number(r.resolved       || 0),
      avg_resolution_hrs: r.avg_resolution_hrs ? Number(r.avg_resolution_hrs) : null,
    })),
  })
})