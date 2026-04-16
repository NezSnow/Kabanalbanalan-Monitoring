import { useMemo, useState } from 'react'
import { initialsShortName, avatarUrl } from '../utils/helpers'
import { uploadMemberPhoto } from '../lib/membersService'
import ConfirmDialog from './ConfirmDialog'

const EMPTY_FORM = { name: '', spiritualName: '', gender: 'male', isVisitor: false, img: '' }

// ── Add / Edit Modal ──────────────────────────────────────────────────────────
function MemberFormModal({ editingMember, onClose, onAdd, onUpdate }) {
  const [form,       setForm]       = useState(
    editingMember
      ? {
          name:          editingMember.name          || '',
          spiritualName: editingMember.spiritualName || '',
          gender:        editingMember.gender        || 'male',
          isVisitor:     !!editingMember.isVisitor,
          img:           editingMember.img           || '',
        }
      : EMPTY_FORM
  )
  const [imgFile,    setImgFile]    = useState(null)
  const [imgPreview, setImgPreview] = useState(editingMember?.img || '')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')

  const previewSrc = imgPreview || form.img || null

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setImgFile(file)
    setImgPreview(URL.createObjectURL(file))
  }

  function removePhoto() {
    setImgFile(null)
    setImgPreview('')
    setForm(f => ({ ...f, img: '' }))
  }

  async function handleSave() {
    const name = form.name.trim()
    if (!name) { setError('Full name is required.'); return }
    setSaving(true)
    setError('')
    try {
      let finalImg = form.img
      if (imgFile) finalImg = await uploadMemberPhoto(imgFile)

      const payload = {
        name,
        spiritualName: form.spiritualName.trim(),
        gender:        form.gender === 'female' ? 'female' : 'male',
        isVisitor:     !!form.isVisitor,
        img:           finalImg,
        short:         initialsShortName(name),
      }

      if (editingMember) {
        await onUpdate(editingMember.id, payload)
      } else {
        await onAdd(payload)
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save member.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal panel */}
      <div className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-2xl overflow-y-auto max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <div className="text-base font-bold text-slate-900">
              {editingMember ? 'Edit Member' : 'Add Member'}
            </div>
            <div className="text-xs text-slate-500">This updates the kiosk list.</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center transition"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}

          {/* Photo preview */}
          {previewSrc && (
            <div className="flex items-center gap-3">
              <img
                src={previewSrc}
                alt="Preview"
                className="w-14 h-14 rounded-full object-cover border border-slate-200 shrink-0"
              />
              <div className="text-xs text-slate-500">
                {imgFile ? 'Will be uploaded when you save.' : 'Current saved photo.'}
              </div>
            </div>
          )}

          {/* Full name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Cinco Dela Cruz"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Spiritual name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Spiritual name <span className="font-normal text-slate-400">(optional)</span></label>
            <input
              type="text"
              value={form.spiritualName}
              onChange={e => setForm(f => ({ ...f, spiritualName: e.target.value }))}
              placeholder="e.g. Aaron"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Gender</label>
            <select
              value={form.gender}
              onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Photo <span className="font-normal text-slate-400">(optional)</span></label>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition">
                Choose photo…
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              {previewSrc ? (
                <button
                  type="button"
                  onClick={removePhoto}
                  className="rounded-lg border border-secondary/30 text-secondary px-3 py-2 text-sm font-semibold hover:bg-secondary/5 transition"
                >
                  Remove
                </button>
              ) : (
                <div className="text-xs text-slate-500">Opens your device file manager.</div>
              )}
            </div>
          </div>

          {/* Visitor */}
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isVisitor}
              onChange={e => setForm(f => ({ ...f, isVisitor: e.target.checked }))}
              className="rounded border-slate-300"
            />
            <span>Visitor</span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!form.name.trim() || saving}
            className="flex-1 rounded-lg bg-primary text-white px-3 py-2 text-sm font-semibold shadow-sm disabled:opacity-50 transition"
          >
            {saving ? 'Saving…' : editingMember ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ManageMembers({ members, onAdd, onUpdate, onDelete }) {
  const [manageQuery,    setManageQuery]    = useState('')
  const [modalOpen,      setModalOpen]      = useState(false)
  const [editingMember,  setEditingMember]  = useState(null)
  const [deleteTarget,   setDeleteTarget]   = useState(null)   // single delete
  const [deleting,       setDeleting]       = useState(false)
  const [selected,       setSelected]       = useState(new Set()) // bulk select
  const [bulkConfirm,    setBulkConfirm]    = useState(false)
  const [bulkDeleting,   setBulkDeleting]   = useState(false)

  const filtered = useMemo(() => {
    const q = manageQuery.trim().toLowerCase()
    const sorted = [...members].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
    return q ? sorted.filter(m => m.name.toLowerCase().includes(q)) : sorted
  }, [members, manageQuery])

  const allSelected  = filtered.length > 0 && filtered.every(m => selected.has(m.id))
  const someSelected = filtered.some(m => selected.has(m.id))
  const selectedCount = [...selected].filter(id => members.some(m => m.id === id)).length

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(m => next.delete(m.id))
        return next
      })
    } else {
      setSelected(prev => {
        const next = new Set(prev)
        filtered.forEach(m => next.add(m.id))
        return next
      })
    }
  }

  function toggleOne(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function openAdd() {
    setEditingMember(null)
    setModalOpen(true)
  }

  function openEdit(m) {
    setEditingMember(m)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingMember(null)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await onDelete(deleteTarget.id)
      setSelected(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n })
      setDeleteTarget(null)
    } catch (err) {
      alert(`Error removing member: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  async function confirmBulkDelete() {
    setBulkDeleting(true)
    try {
      for (const id of selected) {
        await onDelete(id)
      }
      setSelected(new Set())
      setBulkConfirm(false)
    } catch (err) {
      alert(`Error removing members: ${err.message}`)
    } finally {
      setBulkDeleting(false)
    }
  }

  return (
    <main className="px-3 sm:px-6 py-4 sm:py-6">
      <div className="max-w-5xl mx-auto">

        {/* ── Member list ── */}
        <section className="bg-white border border-slate-200 rounded-custom p-4 sm:p-6">

          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <div className="text-lg font-bold">Members</div>
              <div className="text-sm text-slate-500">Add, edit, update, remove</div>
            </div>
            <div className="flex gap-2">
              <input
                value={manageQuery}
                onChange={e => setManageQuery(e.target.value)}
                placeholder="Search name…"
                className="w-full sm:w-56 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                type="button"
                onClick={openAdd}
                className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-semibold shadow-sm whitespace-nowrap hover:bg-primary/90 active:scale-[0.98] transition"
              >
                + Add
              </button>
            </div>
          </div>

          {/* ── Bulk-action bar (visible when any selected) ── */}
          {someSelected && (
            <div className="flex items-center justify-between gap-3 mb-3 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
              <span className="text-sm font-semibold text-red-700">
                {selectedCount} member{selectedCount !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(new Set())}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-500 hover:bg-red-100 transition"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setBulkConfirm(true)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition shadow-sm"
                >
                  Remove Selected
                </button>
              </div>
            </div>
          )}

          {/* ── Select-all row ── */}
          {filtered.length > 0 && (
            <div className="flex items-center gap-3 py-2 border-b border-slate-200 mb-1">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-500 select-none">
                {allSelected ? 'Deselect all' : 'Select all'}
                {filtered.length !== members.length && ` (${filtered.length} shown)`}
              </span>
            </div>
          )}

          {/* ── Member rows ── */}
          <div className="divide-y divide-slate-100">
            {filtered.map(m => {
              const isChecked = selected.has(m.id)
              return (
                <div
                  key={m.id}
                  className={[
                    'py-3 flex items-center gap-3 transition-colors',
                    isChecked ? 'bg-red-50/60' : '',
                  ].join(' ')}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleOne(m.id)}
                    className="w-4 h-4 rounded border-slate-300 accent-primary cursor-pointer shrink-0"
                  />

                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                      src={m.img || avatarUrl(m.id)}
                      alt={m.name}
                    />
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        {m.name}
                        {m.isVisitor && (
                          <span className="ml-2 text-xs text-secondary font-semibold">(Visitor)</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {m.gender === 'female' ? 'Female' : 'Male'} • Tile:{' '}
                        {m.short || initialsShortName(m.name)}
                        {m.spiritualName ? ` • Spiritual: ${m.spiritualName}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                      onClick={() => openEdit(m)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 text-sm rounded-lg border border-secondary/30 text-secondary hover:bg-secondary/5 transition"
                      onClick={() => setDeleteTarget(m)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
            {!filtered.length && (
              <div className="py-10 text-center text-slate-500 text-sm">No members found.</div>
            )}
          </div>
        </section>
      </div>

      {/* ── Add / Edit modal ── */}
      {modalOpen && (
        <MemberFormModal
          editingMember={editingMember}
          onClose={closeModal}
          onAdd={onAdd}
          onUpdate={onUpdate}
        />
      )}

      {/* ── Single delete confirmation ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Remove Member"
        message={deleteTarget ? `Remove ${deleteTarget.name}?` : 'Remove this member?'}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
        danger
        busy={deleting}
      />

      {/* ── Bulk delete confirmation ── */}
      <ConfirmDialog
        open={bulkConfirm}
        title="Remove Selected Members"
        message={`Remove ${selectedCount} selected member${selectedCount !== 1 ? 's' : ''}? This cannot be undone.`}
        confirmLabel={bulkDeleting ? 'Removing…' : `Remove ${selectedCount}`}
        cancelLabel="Cancel"
        onConfirm={confirmBulkDelete}
        onCancel={() => !bulkDeleting && setBulkConfirm(false)}
        danger
        busy={bulkDeleting}
      />
    </main>
  )
}
