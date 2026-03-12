import { useState } from 'react'
import { useOffices } from '../../context/useOffices.jsx'
import { useToast }   from '../../components/ui/Toast.jsx'

// ─── Emoji picker options ─────────────────────────────────────────────────────
const ICON_OPTIONS = ['🏢','💻','📁','💰','👥','📋','🏫','📞','🔧','📊','🎓','🩺','⚖️','🔬','📦','🛠️','📡','🖨️','🗂️','📝']

// ─── Small reusable modal ──────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fadeUp overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-lg leading-none"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ─── Confirm delete modal ──────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onClose }) {
  return (
    <Modal title="Confirm Delete" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-5">{message}</p>
      <div className="flex gap-3 justify-end">
        <button className="btn-secondary text-sm py-2 px-4" onClick={onClose}>Cancel</button>
        <button
          className="text-sm py-2 px-4 rounded-lg font-semibold text-white transition-colors"
          style={{ background: '#dc2626' }}
          onClick={() => { onConfirm(); onClose() }}
        >
          Delete
        </button>
      </div>
    </Modal>
  )
}

// ─── Office Form ──────────────────────────────────────────────────────────────
function OfficeForm({ initial = {}, onSave, onClose }) {
  const [name,        setName]        = useState(initial.name        || '')
  const [icon,        setIcon]        = useState(initial.icon        || '🏢')
  const [description, setDescription] = useState(initial.description || '')
  const [showPicker,  setShowPicker]  = useState(false)

  return (
    <div className="space-y-4">
      {/* Icon picker */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Icon</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPicker(p => !p)}
            className="w-12 h-12 rounded-xl text-2xl flex items-center justify-center border-2 transition-colors"
            style={{ borderColor: showPicker ? '#0B4E3D' : '#e5e7eb', background: '#f8faf9' }}
          >
            {icon}
          </button>
          <span className="text-xs text-gray-400">Click to change icon</span>
        </div>
        {showPicker && (
          <div className="mt-2 p-2 rounded-xl border border-gray-200 flex flex-wrap gap-1" style={{ background: '#f8faf9' }}>
            {ICON_OPTIONS.map(em => (
              <button
                key={em}
                type="button"
                onClick={() => { setIcon(em); setShowPicker(false) }}
                className="w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-colors hover:bg-white"
                style={{ background: icon === em ? '#e8f5f1' : 'transparent', border: icon === em ? '2px solid #0B4E3D' : '2px solid transparent' }}
              >
                {em}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Office Name *</label>
        <input
          className="input-field"
          placeholder="e.g. Records Office"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
        <input
          className="input-field"
          placeholder="Short description of this office"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button className="btn-secondary flex-1 text-sm py-2" onClick={onClose}>Cancel</button>
        <button
          className="btn-primary flex-1 text-sm py-2"
          disabled={!name.trim()}
          onClick={() => { onSave({ name, icon, description }); onClose() }}
        >
          {initial.id ? 'Save Changes' : 'Add Office'}
        </button>
      </div>
    </div>
  )
}

// ─── Service Form ─────────────────────────────────────────────────────────────
function ServiceForm({ initial = {}, onSave, onClose }) {
  const [label, setLabel] = useState(initial.label || '')
  const [icon,  setIcon]  = useState(initial.icon  || '🔧')
  const [desc,  setDesc]  = useState(initial.desc  || '')
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Icon</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowPicker(p => !p)}
            className="w-12 h-12 rounded-xl text-2xl flex items-center justify-center border-2 transition-colors"
            style={{ borderColor: showPicker ? '#0B4E3D' : '#e5e7eb', background: '#f8faf9' }}
          >
            {icon}
          </button>
          <span className="text-xs text-gray-400">Click to change icon</span>
        </div>
        {showPicker && (
          <div className="mt-2 p-2 rounded-xl border border-gray-200 flex flex-wrap gap-1" style={{ background: '#f8faf9' }}>
            {ICON_OPTIONS.map(em => (
              <button
                key={em}
                type="button"
                onClick={() => { setIcon(em); setShowPicker(false) }}
                className="w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-colors hover:bg-white"
                style={{ background: icon === em ? '#e8f5f1' : 'transparent', border: icon === em ? '2px solid #0B4E3D' : '2px solid transparent' }}
              >
                {em}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Service Name *</label>
        <input
          className="input-field"
          placeholder="e.g. Password Reset"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 mb-1">Description</label>
        <input
          className="input-field"
          placeholder="Short description shown to the public"
          value={desc}
          onChange={e => setDesc(e.target.value)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button className="btn-secondary flex-1 text-sm py-2" onClick={onClose}>Cancel</button>
        <button
          className="btn-primary flex-1 text-sm py-2"
          disabled={!label.trim()}
          onClick={() => { onSave({ label, icon, desc }); onClose() }}
        >
          {initial.id ? 'Save Changes' : 'Add Service'}
        </button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminOffices() {
  const {
    offices, servicesMap,
    addOffice, updateOffice, toggleOfficeStatus, deleteOffice,
    getServices, addService, updateService, deleteService, reorderService,
  } = useOffices()
  const toast = useToast()

  const [selectedOffice, setSelectedOffice] = useState(offices[0] || null)

  // Modal state: null | 'add-office' | 'edit-office' | 'add-service' | 'edit-service' | 'confirm-office' | 'confirm-service'
  const [modal,          setModal]          = useState(null)
  const [editingOffice,  setEditingOffice]  = useState(null)
  const [editingService, setEditingService] = useState(null)
  const [confirmTarget,  setConfirmTarget]  = useState(null)

  const services = selectedOffice ? getServices(selectedOffice.id) : []

  function openEditOffice(office) {
    setEditingOffice(office)
    setModal('edit-office')
  }
  function openDeleteOffice(office) {
    setConfirmTarget(office)
    setModal('confirm-office')
  }
  function openEditService(svc) {
    setEditingService(svc)
    setModal('edit-service')
  }
  function openDeleteService(svc) {
    setConfirmTarget(svc)
    setModal('confirm-service')
  }

  return (
    <div className="p-6 animate-fadeUp">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Offices & Services</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage offices and their available services shown to the public.
          </p>
        </div>
        <button
          className="btn-primary text-sm flex items-center gap-2"
          onClick={() => setModal('add-office')}
        >
          + Add Office
        </button>
      </div>

      <div className="grid md:grid-cols-5 gap-6">

        {/* ── Left: Office list ── */}
        <div className="md:col-span-2">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Offices ({offices.length})
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {offices.map(office => (
                <div
                  key={office.id}
                  onClick={() => setSelectedOffice(office)}
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors"
                  style={selectedOffice?.id === office.id
                    ? { background: '#e8f5f1' }
                    : { background: 'white' }
                  }
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: office.comingSoon ? '#f3f4f6' : '#e8f5f1' }}
                  >
                    {office.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">{office.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {(servicesMap[office.id] || []).length} service{(servicesMap[office.id] || []).length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                    style={office.comingSoon
                      ? { background: '#fef3c7', color: '#92400e' }
                      : { background: '#dcfce7', color: '#166534' }
                    }
                  >
                    {office.comingSoon ? 'Inactive' : 'Active'}
                  </span>
                </div>
              ))}

              {offices.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-gray-400">
                  No offices yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Office detail + services ── */}
        <div className="md:col-span-3">
          {!selectedOffice ? (
            <div className="card p-10 text-center text-gray-400">
              <div className="text-4xl mb-3">🏢</div>
              <div className="font-semibold">Select an office</div>
              <p className="text-sm mt-1">Click an office on the left to manage it.</p>
            </div>
          ) : (
            <div className="space-y-4 animate-fadeUp" key={selectedOffice.id}>

              {/* Office card */}
              <div className="card p-5">
                <div className="flex items-start gap-4">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                    style={{ background: selectedOffice.comingSoon ? '#f3f4f6' : '#e8f5f1' }}
                  >
                    {selectedOffice.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-gray-800">{selectedOffice.name}</h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={selectedOffice.comingSoon
                          ? { background: '#fef3c7', color: '#92400e' }
                          : { background: '#dcfce7', color: '#166534' }
                        }
                      >
                        {selectedOffice.comingSoon ? 'Inactive' : '● Active'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {selectedOffice.description || 'No description.'}
                    </p>
                  </div>
                </div>

                {/* Office actions */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    className="btn-secondary text-xs py-1.5 px-3"
                    onClick={() => openEditOffice(selectedOffice)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="text-xs py-1.5 px-3 rounded-lg font-semibold transition-colors border"
                    style={selectedOffice.comingSoon
                      ? { borderColor: '#16a34a', color: '#16a34a', background: 'transparent' }
                      : { borderColor: '#d97706', color: '#d97706', background: 'transparent' }
                    }
                    onClick={() => { toggleOfficeStatus(selectedOffice.id); toast.info(selectedOffice.comingSoon ? `${selectedOffice.name} is now Active.` : `${selectedOffice.name} set to Inactive.`) }}
                  >
                    {selectedOffice.comingSoon ? '✅ Set Active' : '⏸ Set Inactive'}
                  </button>
                  <button
                    className="text-xs py-1.5 px-3 rounded-lg font-semibold transition-colors border ml-auto"
                    style={{ borderColor: '#fca5a5', color: '#dc2626', background: 'transparent' }}
                    onClick={() => openDeleteOffice(selectedOffice)}
                  >
                    🗑 Delete Office
                  </button>
                </div>
              </div>

              {/* Services */}
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-800 text-sm">Services</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {services.length} service{services.length !== 1 ? 's' : ''} — shown to public when submitting a ticket
                    </div>
                  </div>
                  <button
                    className="btn-primary text-xs py-1.5 px-3"
                    onClick={() => setModal('add-service')}
                  >
                    + Add Service
                  </button>
                </div>

                {services.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-400">
                    <div className="text-3xl mb-2">📋</div>
                    No services yet. Click <strong>+ Add Service</strong> to get started.
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {services.map((svc, idx) => (
                      <div
                        key={svc.id}
                        className="flex items-center gap-3 px-5 py-3.5 group"
                      >
                        {/* Reorder buttons */}
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            disabled={idx === 0}
                            onClick={() => reorderService(selectedOffice.id, idx, idx - 1)}
                            className="w-5 h-5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 flex items-center justify-center text-xs"
                          >
                            ▲
                          </button>
                          <button
                            disabled={idx === services.length - 1}
                            onClick={() => reorderService(selectedOffice.id, idx, idx + 1)}
                            className="w-5 h-5 rounded text-gray-400 hover:text-gray-600 disabled:opacity-20 flex items-center justify-center text-xs"
                          >
                            ▼
                          </button>
                        </div>

                        <div className="text-xl w-7 text-center flex-shrink-0">{svc.icon}</div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-800">{svc.label}</div>
                          <div className="text-xs text-gray-400 truncate">{svc.desc || svc.description || '—'}</div>
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                            onClick={() => openEditService(svc)}
                            title="Edit service"
                          >
                            ✏️
                          </button>
                          <button
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-red-50 text-gray-400 hover:text-red-600"
                            onClick={() => openDeleteService(svc)}
                            title="Delete service"
                          >
                            🗑
                          </button>
                        </div>

                        <div className="text-xs text-gray-300 flex-shrink-0 w-5 text-right">
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Future features hint */}
              <div
                className="rounded-xl p-4 text-xs text-gray-500 flex items-start gap-2"
                style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
              >
                <span className="text-base flex-shrink-0">💡</span>
                <div>
                  <strong className="text-yellow-800">Future-ready:</strong> Once connected to the backend,
                  all changes here will be saved to the database automatically. You can activate/deactivate offices,
                  reorder services, and add new ones without touching the code.
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}

      {modal === 'add-office' && (
        <Modal title="Add New Office" onClose={() => setModal(null)}>
          <OfficeForm
            onSave={data => {
              const office = addOffice(data)
              setSelectedOffice(office)
              toast.success(`Office "${data.name}" added.`)
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal === 'edit-office' && editingOffice && (
        <Modal title="Edit Office" onClose={() => setModal(null)}>
          <OfficeForm
            initial={editingOffice}
            onSave={data => { updateOffice(editingOffice.id, data); toast.success('Office updated.') }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal === 'add-service' && selectedOffice && (
        <Modal title={`Add Service — ${selectedOffice.name}`} onClose={() => setModal(null)}>
          <ServiceForm
            onSave={data => { addService(selectedOffice.id, data); toast.success(`Service "${data.label}" added.`) }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal === 'edit-service' && editingService && (
        <Modal title="Edit Service" onClose={() => setModal(null)}>
          <ServiceForm
            initial={editingService}
            onSave={data => { updateService(selectedOffice.id, editingService.id, data); toast.success('Service updated.') }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {modal === 'confirm-office' && confirmTarget && (
        <ConfirmModal
          message={`Delete "${confirmTarget.name}"? This will also remove all its services. This cannot be undone.`}
          onConfirm={() => {
            deleteOffice(confirmTarget.id)
            setSelectedOffice(offices.find(o => o.id !== confirmTarget.id) || null)
            toast.error(`Office "${confirmTarget.name}" deleted.`)
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'confirm-service' && confirmTarget && (
        <ConfirmModal
          message={`Delete service "${confirmTarget.label}"? This cannot be undone.`}
          onConfirm={() => { deleteService(selectedOffice.id, confirmTarget.id); toast.error(`Service "${confirmTarget.label}" deleted.`) }}
          onClose={() => setModal(null)}
        />
      )}

    </div>
  )
}