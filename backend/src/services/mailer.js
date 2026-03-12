// src/services/mailer.js
import nodemailer from 'nodemailer'
import { ENV } from '../config/env.js'

// ── Transporter ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST   || 'smtp.gmail.com',
  port:   Number(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
})

const FROM    = `"DepEd ZamSib Helpdesk" <${process.env.MAIL_USER}>`
const CLIENT  = process.env.CLIENT_URL || 'http://localhost:3000'

// ── Shared HTML shell ─────────────────────────────────────────────────────────
function shell(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>DepEd ZamSib Helpdesk</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f3;color:#1a1a1a}
  .wrap{max-width:580px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .header{background:linear-gradient(135deg,#0B4E3D 0%,#16735a 100%);padding:32px 36px;text-align:center}
  .header img{height:48px;margin-bottom:12px}
  .header h1{color:#fff;font-size:20px;font-weight:700;letter-spacing:.3px}
  .header p{color:rgba(255,255,255,.75);font-size:13px;margin-top:4px}
  .body{padding:32px 36px}
  .greeting{font-size:16px;font-weight:600;color:#0B4E3D;margin-bottom:8px}
  .text{font-size:14px;color:#4a5568;line-height:1.7;margin-bottom:16px}
  .ticket-box{background:#f8faf9;border:1px solid #d1e8e2;border-radius:12px;padding:20px 24px;margin:20px 0}
  .ticket-id{font-size:22px;font-weight:800;color:#0B4E3D;letter-spacing:.5px}
  .ticket-label{font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px}
  .info-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e8f0ed;font-size:13px}
  .info-row:last-child{border-bottom:none}
  .info-key{color:#6b7280;font-weight:500}
  .info-val{color:#1a1a1a;font-weight:600;text-align:right;max-width:60%}
  .status-badge{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px}
  .status-open{background:#dbeafe;color:#1d4ed8}
  .status-inprogress{background:#fef3c7;color:#92400e}
  .status-resolved{background:#d1fae5;color:#065f46}
  .status-closed{background:#f3f4f6;color:#374151}
  .btn{display:inline-block;background:#0B4E3D;color:#fff!important;padding:13px 28px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none;margin:20px 0;letter-spacing:.3px}
  .csm-box{background:linear-gradient(135deg,#fef9e7,#fef3c7);border:1px solid #FFC107;border-radius:12px;padding:20px 24px;margin:20px 0;text-align:center}
  .csm-box h3{color:#92400e;font-size:15px;margin-bottom:6px}
  .csm-box p{color:#78350f;font-size:13px;margin-bottom:14px;line-height:1.6}
  .csm-btn{display:inline-block;background:#FFC107;color:#1a1a1a!important;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:700;text-decoration:none}
  .footer{background:#f8faf9;padding:20px 36px;text-align:center;border-top:1px solid #e8f0ed}
  .footer p{font-size:12px;color:#9ca3af;line-height:1.6}
  .footer a{color:#0B4E3D;text-decoration:none}
  .divider{height:1px;background:#e8f0ed;margin:20px 0}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>🎓 DepEd Division of Zamboanga Sibugay</h1>
    <p>ICT Helpdesk & Ticketing System</p>
  </div>
  <div class="body">
    ${bodyHtml}
  </div>
  <div class="footer">
    <p>This is an automated message from the DepEd ZamSib Helpdesk System.<br/>
    Please do not reply directly to this email.<br/>
    Track your ticket at <a href="${CLIENT}/track">${CLIENT}/track</a></p>
  </div>
</div>
</body>
</html>`
}

// ── Status badge helper ───────────────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    'open':        ['status-open',       'Open'],
    'in-progress': ['status-inprogress', 'In Progress'],
    'resolved':    ['status-resolved',   'Resolved'],
    'closed':      ['status-closed',     'Closed'],
  }
  const [cls, label] = map[status] || ['status-open', status]
  return `<span class="status-badge ${cls}">${label}</span>`
}

// ── 1. Ticket confirmation ────────────────────────────────────────────────────
export async function sendTicketConfirmation({ to, name, ticketId, subject, office, service }) {
  const trackUrl = `${CLIENT}/track?id=${ticketId}`
  const html = shell(`
    <div class="greeting">Hello, ${name}!</div>
    <p class="text">
      Your helpdesk ticket has been successfully submitted. Our ICT team will review it
      and get back to you as soon as possible.
    </p>
    <div class="ticket-box">
      <div class="ticket-label">Your Ticket Number</div>
      <div class="ticket-id">${ticketId}</div>
      <div style="margin-top:16px">
        <div class="info-row"><span class="info-key">Subject</span><span class="info-val">${subject}</span></div>
        <div class="info-row"><span class="info-key">Office</span><span class="info-val">${office}</span></div>
        <div class="info-row"><span class="info-key">Service</span><span class="info-val">${service}</span></div>
        <div class="info-row"><span class="info-key">Status</span><span class="info-val">${statusBadge('open')}</span></div>
      </div>
    </div>
    <p class="text">
      Please save your ticket number — you will need it to track the status of your request.
    </p>
    <a href="${trackUrl}" class="btn">🔍 Track My Ticket</a>
    <div class="divider"></div>
    <p class="text" style="font-size:13px;color:#6b7280">
      You will receive an email whenever the status of your ticket is updated.
      If you have additional information to add, please submit a new ticket and reference this number.
    </p>
  `)

  await transporter.sendMail({
    from:    FROM,
    to,
    subject: `[${ticketId}] Ticket Received — ${subject}`,
    html,
  })
}

// ── 2. Status update notification ────────────────────────────────────────────
export async function sendStatusUpdate({ to, name, ticketId, subject, oldStatus, newStatus, officeName, resolution, csmToken }) {
  const trackUrl = `${CLIENT}/track?id=${ticketId}`
  const csmUrl   = csmToken ? `${CLIENT}/csm/${csmToken}` : `${CLIENT}/csm`
  const isResolved = newStatus === 'resolved'
  const isClosed   = newStatus === 'closed'

  const statusMessages = {
    'in-progress': { emoji: '⚙️',  msg: 'Our team has started working on your ticket. We will keep you updated on the progress.' },
    'resolved':    { emoji: '✅', msg: 'Great news! Your ticket has been marked as resolved. We hope the issue has been addressed to your satisfaction.' },
    'closed':      { emoji: '🔒', msg: 'Your ticket has been closed. If your issue persists or you have a new concern, please submit a new ticket.' },
  }
  const { emoji, msg } = statusMessages[newStatus] || { emoji: '🔄', msg: 'Your ticket status has been updated.' }

  const html = shell(`
    <div class="greeting">Hello, ${name}!</div>
    <p class="text">${emoji} ${msg}</p>
    <div class="ticket-box">
      <div class="ticket-label">Ticket Update</div>
      <div class="ticket-id">${ticketId}</div>
      <div style="margin-top:16px">
        <div class="info-row"><span class="info-key">Subject</span><span class="info-val">${subject}</span></div>
        <div class="info-row"><span class="info-key">Office</span><span class="info-val">${officeName}</span></div>
        <div class="info-row"><span class="info-key">Previous Status</span><span class="info-val">${statusBadge(oldStatus)}</span></div>
        <div class="info-row"><span class="info-key">New Status</span><span class="info-val">${statusBadge(newStatus)}</span></div>
        ${resolution ? `<div class="info-row"><span class="info-key">Resolution</span><span class="info-val" style="color:#065f46">${resolution}</span></div>` : ''}
      </div>
    </div>
    <a href="${trackUrl}" class="btn">🔍 View Ticket Status</a>
    ${isResolved || isClosed ? `
    <div class="csm-box">
      <h3>⭐ How did we do?</h3>
      <p>Your feedback helps us improve our services. Please take a moment to rate your experience with the DepEd ZamSib ICT Helpdesk.</p>
      <a href="${csmUrl}" class="csm-btn">📝 Fill Out Satisfaction Survey</a>
    </div>
    ` : ''}
    <div class="divider"></div>
    <p class="text" style="font-size:13px;color:#6b7280">
      If you have questions about this update, please submit a new ticket referencing <strong>${ticketId}</strong>.
    </p>
  `)

  await transporter.sendMail({
    from:    FROM,
    to,
    subject: `[${ticketId}] Status Update — ${newStatus === 'in-progress' ? 'In Progress' : newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
    html,
  })
}

// ── Verify connection on startup ──────────────────────────────────────────────
export async function verifyMailer() {
  try {
    await transporter.verify()
    console.log('✅ Mail server connected.')
  } catch (err) {
    console.warn('⚠️  Mail server not connected:', err.message)
    console.warn('   Email notifications will be disabled until MAIL_* env vars are set.')
  }
}