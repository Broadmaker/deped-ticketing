// src/pages/public/SubmitPage.jsx
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTickets } from '../../context/useTickets.jsx'
import { useOffices } from '../../context/useOffices.jsx'
import { useToast }   from '../../components/ui/Toast.jsx'

function SelectOffice({ offices, onSelect }) {
  return (
    <div className="animate-fadeUp">
      <h2 className="text-2xl font-bold text-gray-800 mb-1">Select an Office</h2>
      <p className="text-sm text-gray-500 mb-6">Choose the office that handles your concern.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offices.map(office => (
          <div
            key={office.id}
            onClick={() => !office.comingSoon && onSelect(office)}
            className={`card flex items-start gap-4 p-6 border-2 border-transparent
              ${office.comingSoon
                ? 'opacity-60 cursor-not-allowed'
                : 'cursor-pointer card-hover hover:border-green-200'
              }`}
          >
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: office.comingSoon ? '#f3f4f6' : '#e8f5f1' }}>
              {office.icon}
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-800 flex items-center gap-2">
                {office.name}
                {office.comingSoon && (
                  <span className="text-xs px-2 py-0.5 rounded font-semibold"
                    style={{ background: '#fef3c7', color: '#92400e' }}>Coming Soon</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{office.description}</p>
              {!office.comingSoon && (
                <p className="text-xs font-semibold mt-2" style={{ color: '#0B4E3D' }}>Select →</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SelectService({ office, services, onSelect, onBack }) {
  return (
    <div className="animate-fadeUp">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
        ← Back to Offices
      </button>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: '#e8f5f1' }}>
          {office.icon}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{office.name}</h2>
          <p className="text-sm text-gray-500">Select the type of service you need</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {services.map(svc => (
          <div
            key={svc.id}
            onClick={() => onSelect(svc)}
            className="card p-4 border-2 border-transparent cursor-pointer card-hover hover:border-green-200 flex items-start gap-3"
          >
            <div className="text-2xl w-8 flex-shrink-0">{svc.icon}</div>
            <div>
              <div className="font-semibold text-gray-800 text-sm">{svc.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{svc.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TicketForm({ office, service, onBack, onSubmit, submitting }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', school: '', subject: '', concern: '' })
  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))
  const isValid = form.name && form.email && form.school && form.subject && form.concern

  return (
    <div className="animate-fadeUp max-w-2xl">
      <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
        ← Back to Services
      </button>
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
          <span className="text-xl">{office.icon}</span>
          <span className="text-sm font-semibold text-gray-600">{office.name}</span>
          <span className="text-gray-300">·</span>
          <span className="text-sm font-semibold" style={{ color: '#0B4E3D' }}>
            {service.icon} {service.label}
          </span>
        </div>
        <h3 className="font-bold text-gray-800 text-base mb-1">Fill in your details</h3>
        <p className="text-xs text-gray-400 mb-5">Fields marked * are required.</p>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
              <input className="input-field" placeholder="Juan dela Cruz" value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address *</label>
              <input className="input-field" type="email" placeholder="juan@deped.gov.ph" value={form.email} onChange={set('email')} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
              <input className="input-field" placeholder="09171234567 (optional)" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">School / Office *</label>
              <input className="input-field" placeholder="e.g. Ipil Central School" value={form.school} onChange={set('school')} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Subject *</label>
            <input className="input-field" placeholder="Brief description of your concern" value={form.subject} onChange={set('subject')} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Concern *</label>
            <textarea className="input-field" rows={5}
              placeholder="Describe your concern in detail. Include relevant information such as error messages, affected units, or when the issue started."
              value={form.concern} onChange={set('concern')} />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-secondary" onClick={onBack} disabled={submitting}>← Back</button>
            <button
              className="btn-gold flex-1"
              disabled={!isValid || submitting}
              onClick={() => onSubmit({ ...form, officeId: office.id, service: service.id })}
            >
              {submitting ? '⏳ Submitting...' : '✓ Submit Ticket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SuccessView({ ticket, submitterEmail, onTrack, onNew }) {
  return (
    <div className="animate-fadeUp max-w-lg mx-auto text-center">
      <div className="card p-10">
        <div className="w-18 h-18 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ width: 72, height: 72,
            background: 'linear-gradient(135deg, #0B4E3D, #1a7a5e)',
            boxShadow: '0 8px 24px rgba(11,78,61,0.3)' }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Ticket Submitted!</h2>
        <p className="text-gray-500 text-sm mb-6">
          Your concern has been received. Please save your ticket ID for tracking.
        </p>
        <div className="rounded-xl py-5 px-6 mb-6"
          style={{ background: '#e8f5f1', border: '2px dashed #0B4E3D' }}>
          <div className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Your Ticket ID</div>
          <div className="text-3xl font-bold tracking-wider"
            style={{ color: '#0B4E3D', fontFamily: 'monospace' }}>{ticket.id}</div>
        </div>
        <p className="text-xs text-gray-400 mb-6">
          The ICT Office will respond within 1–3 business days.
        </p>
        <div className="flex gap-3 justify-center">
          <button className="btn-primary" onClick={onTrack}>Track This Ticket</button>
          <button className="btn-secondary" onClick={onNew}>Submit Another</button>
        </div>
      </div>
    </div>
  )
}

export default function SubmitPage() {
  const navigate        = useNavigate()
  const [searchParams]  = useSearchParams()
  const { addTicket }   = useTickets()
  const { offices, getServices } = useOffices()
  const toast           = useToast()

  const preselectedOfficeId = searchParams.get('office')
  const preselectedOffice   = preselectedOfficeId
    ? offices.find(o => o.id === preselectedOfficeId && !o.comingSoon) : null

  const [step,       setStep]    = useState(preselectedOffice ? 'service' : 'office')
  const [selOffice,  setOffice]  = useState(preselectedOffice)
  const [selService, setService] = useState(null)
  const [submitted,  setSubmit]  = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleFormSubmit(data) {
    setSubmitting(true)
    try {
      const res = await addTicket(data)
      setSubmit({ id: res.id })
      setStep('success')
      toast.success('Your ticket has been submitted!')
    } catch (err) {
      toast.error(err.message || 'Failed to submit ticket. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleNew() { setStep('office'); setOffice(null); setService(null); setSubmit(null) }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {step === 'office' && <SelectOffice offices={offices} onSelect={o => { setOffice(o); setStep('service') }} />}
      {step === 'service' && selOffice && (
        <SelectService office={selOffice} services={getServices(selOffice.id)}
          onSelect={s => { setService(s); setStep('form') }} onBack={() => setStep('office')} />
      )}
      {step === 'form' && selOffice && selService && (
        <TicketForm office={selOffice} service={selService}
          onBack={() => setStep('service')} onSubmit={handleFormSubmit} submitting={submitting} />
      )}
      {step === 'success' && submitted && (
        <SuccessView ticket={submitted}
          onTrack={() => navigate(`/track?id=${submitted.id}`)} onNew={handleNew} />
      )}
    </div>
  )
}