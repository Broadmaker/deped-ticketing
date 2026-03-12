// src/modules/reports/reports.controller.js
import pool from '../../config/db.js'
import { asyncHandler } from '../../middleware/errorHandler.js'

function getDateRange(query) {
  const { range, date_from, date_to } = query
  let from = new Date()
  let to   = new Date()
  to.setHours(23, 59, 59, 999)

  if (date_from && date_to) {
    from = new Date(date_from); from.setHours(0,0,0,0)
    to   = new Date(date_to);   to.setHours(23,59,59,999)
  } else {
    from.setHours(0,0,0,0)
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
    from.setDate(from.getDate() - (days - 1))
  }
  return { from: from.toISOString(), to: to.toISOString() }
}

function officeScope(user) {
  return user.role === 'superadmin' ? '' : `AND t.office_id = '${user.office_id}'`
}
function userOfficeScope(user) {
  return user.role === 'superadmin' ? '' : `AND u.office_id = '${user.office_id}'`
}

export const getSummary = asyncHandler(async (req, res) => {
  const user = req.user
  const { from, to } = getDateRange(req.query)
  const os = officeScope(user)
  const us = userOfficeScope(user)

  const [totalsRes, statusRes, priorityRes, officeRes, serviceRes,
         resolutionRes, hourRes, dayRes, staffRes] = await Promise.all([

    pool.query(`
      SELECT
        COUNT(*)                                                            AS total,
        COUNT(*) FILTER (WHERE status = 'open')                            AS open,
        COUNT(*) FILTER (WHERE status = 'in-progress')                     AS in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved')                        AS resolved,
        COUNT(*) FILTER (WHERE status = 'closed')                          AS closed,
        COUNT(*) FILTER (WHERE assigned_to_id IS NULL AND status = 'open') AS unassigned
      FROM tickets t
      WHERE t.created_at BETWEEN $1 AND $2 ${os}
    `, [from, to]),

    pool.query(`
      SELECT status, COUNT(*) AS count FROM tickets t
      WHERE t.created_at BETWEEN $1 AND $2 ${os}
      GROUP BY status ORDER BY count DESC
    `, [from, to]),

    pool.query(`
      SELECT priority, COUNT(*) AS count FROM tickets t
      WHERE t.created_at BETWEEN $1 AND $2 ${os}
      GROUP BY priority ORDER BY count DESC
    `, [from, to]),

    pool.query(`
      SELECT o.name AS office, o.icon, COUNT(*) AS count
      FROM tickets t JOIN offices o ON o.id = t.office_id
      WHERE t.created_at BETWEEN $1 AND $2 ${os}
      GROUP BY o.id, o.name, o.icon ORDER BY count DESC
    `, [from, to]),

    pool.query(`
      SELECT s.label AS service, s.icon, o.name AS office, COUNT(*) AS count
      FROM tickets t
      JOIN services s ON s.id = t.service_id
      JOIN offices  o ON o.id = t.office_id
      WHERE t.created_at BETWEEN $1 AND $2 ${os}
      GROUP BY s.id, s.label, s.icon, o.name ORDER BY count DESC LIMIT 10
    `, [from, to]),

    pool.query(`
      SELECT
        ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/3600)::NUMERIC,2) AS avg_hours,
        ROUND(MIN(EXTRACT(EPOCH FROM (updated_at - created_at))/3600)::NUMERIC,2) AS min_hours,
        ROUND(MAX(EXTRACT(EPOCH FROM (updated_at - created_at))/3600)::NUMERIC,2) AS max_hours,
        COUNT(*) AS resolved_count
      FROM tickets t
      WHERE t.created_at BETWEEN $1 AND $2
        AND t.status IN ('resolved','closed') ${os}
    `, [from, to]),

    pool.query(`
      SELECT EXTRACT(HOUR FROM t.created_at AT TIME ZONE 'Asia/Manila')::INT AS hour,
             COUNT(*) AS count
      FROM tickets t WHERE t.created_at BETWEEN $1 AND $2 ${os}
      GROUP BY hour ORDER BY hour
    `, [from, to]),

    pool.query(`
      SELECT EXTRACT(DOW FROM t.created_at AT TIME ZONE 'Asia/Manila')::INT AS dow,
             COUNT(*) AS count
      FROM tickets t WHERE t.created_at BETWEEN $1 AND $2 ${os}
      GROUP BY dow ORDER BY dow
    `, [from, to]),

    pool.query(`
      SELECT
        u.name, u.role, u.avatar,
        o.name AS office,
        COUNT(t.id)                                                         AS total_assigned,
        COUNT(t.id) FILTER (WHERE t.status IN ('open','in-progress'))      AS active,
        COUNT(t.id) FILTER (WHERE t.status = 'resolved')                   AS resolved,
        COUNT(t.id) FILTER (WHERE t.status = 'closed')                     AS closed,
        ROUND(AVG(
          EXTRACT(EPOCH FROM (t.updated_at - t.created_at))/3600
        ) FILTER (WHERE t.status IN ('resolved','closed'))::NUMERIC, 1)    AS avg_resolution_hrs
      FROM users u
      LEFT JOIN tickets t ON t.assigned_to_id = u.id
        AND t.created_at BETWEEN $1 AND $2
      LEFT JOIN offices o ON o.id = u.office_id
      WHERE u.role IN ('staff','office_admin') AND u.status = 'active' ${us}
      GROUP BY u.id, u.name, u.role, u.avatar, o.name
      ORDER BY total_assigned DESC
    `, [from, to]),
  ])

  res.json({
    range:       { from, to },
    totals:      totalsRes.rows[0],
    by_status:   statusRes.rows,
    by_priority: priorityRes.rows,
    by_office:   officeRes.rows,
    by_service:  serviceRes.rows,
    resolution:  resolutionRes.rows[0],
    peak_hours:  hourRes.rows,
    peak_days:   dayRes.rows,
    staff:       staffRes.rows,
  })
})