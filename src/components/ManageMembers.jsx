import { useMemo, useState } from 'react'
import { initialsShortName, avatarUrl } from '../utils/helpers'
import { uploadMemberPhoto } from '../lib/membersService'
import ConfirmDialog from './ConfirmDialog'

const EMPTY_FORM = { name: '', spiritualName: '', gender: 'male', isVisitor: false, img: '' }

export default function ManageMembers({ members, onAdd, onUpdate, onDelete }) {
  const [manageQuery,   setManageQuery]   = useState('')
  const [editingMember, setEditingMember] = useState(null)
  const [form,          setForm]          = useState(EMPTY_FORM)
  const [imgFile,       setImgFile]       = useState(null)   // raw File from picker
  const [imgPreview,    setImgPreview]    = useState('')      // local object URL for preview
  const [saving,        setSaving]        = useState(false)
  const [deleteTarget,  setDeleteTarget]  = useState(null)
  const [deleting,      setDeleting]      = useState(false)

  const filtered = useMemo(() => {
    const q = manageQuery.trim().toLowerCase()
    const sorted = [...members].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
    return q ? sorted.filter(m => m.name.toLowerCase().includes(q)) : sorted
  }, [members, manageQuery])

  function startAdd() {
    setEditingMember(null)
    setForm(EMPTY_FORM)
    setImgFile(null)
    setImgPreview('')
  }

  function startEdit(m) {
    setEditingMember(m)
    setForm({
      name:         m.name || '',
      spiritualName: m.spiritualName || '',
      gender:       m.gender || 'male',
      isVisitor:    !!m.isVisitor,
      img:          m.img || '',
    })
    setImgFile(null)
    setImgPreview(m.img || '')
  }

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
    if (!name) return
    setSaving(true)
    try {
      let finalImg = form.img
      if (imgFile) {
        finalImg = await uploadMemberPhoto(imgFile)
      }

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
        setEditingMember(null)
      } else {
        await onAdd(payload)
      }
      setForm(EMPTY_FORM)
      setImgFile(null)
      setImgPreview('')
    } catch (err) {
      console.error('Save member failed:', err)
      alert(`Error saving member: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  function askDelete(m) {
    setDeleteTarget(m)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await onDelete(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      alert(`Error removing member: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  const previewSrc = imgPreview || form.img || null

  return (
    <main className="px-3 sm:px-6 py-4 sm:py-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Member list ── */}
        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-custom p-4 sm:p-6">
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
                className="w-full sm:w-56 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={startAdd}
                className="rounded-lg bg-primary text-white px-3 py-2 text-sm font-semibold shadow-sm whitespace-nowrap"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.map(m => (
              <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
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
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
                    onClick={() => startEdit(m)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-sm rounded-lg border border-secondary/30 text-secondary hover:bg-secondary/5"
                    onClick={() => askDelete(m)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {!filtered.length && (
              <div className="py-10 text-center text-slate-500 text-sm">No members found.</div>
            )}
          </div>
        </section>

        {/* ── Add / Edit form ── */}
        <section className="bg-white border border-slate-200 rounded-custom p-4 sm:p-6">
          <div className="text-lg font-bold mb-1">
            {editingMember ? 'Edit Member' : 'Add Member'}
          </div>
          <div className="text-sm text-slate-500 mb-4">This updates the kiosk list.</div>

          <label className="block text-sm font-semibold mb-1">Full name</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Cinco Dela Cruz"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3"
          />

          <label className="block text-sm font-semibold mb-1">Spiritual name (optional)</label>
          <input
            value={form.spiritualName}
            onChange={e => setForm(f => ({ ...f, spiritualName: e.target.value }))}
            placeholder="e.g. Aaron"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3"
          />

          <label className="block text-sm font-semibold mb-1">Gender</label>
          <select
            value={form.gender}
            onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>

          <label className="block text-sm font-semibold mb-1">Photo (optional)</label>
          <div className="flex items-center gap-3 mb-3">
            <label className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50 active:bg-slate-100 cursor-pointer">
              Choose photo…
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
            {previewSrc ? (
              <button
                type="button"
                onClick={removePhoto}
                className="rounded-lg border border-secondary/30 text-secondary px-3 py-2 text-sm font-semibold hover:bg-secondary/5"
              >
                Remove
              </button>
            ) : (
              <div className="text-xs text-slate-500">Opens your device file manager.</div>
            )}
          </div>

          {previewSrc && (
            <div className="mb-3 flex items-center gap-3">
              <img
                src={previewSrc}
                alt="Selected"
                className="w-14 h-14 rounded-full object-cover border border-slate-200"
              />
              <div className="text-xs text-slate-500">
                {imgFile
                  ? 'Photo will be uploaded to Supabase Storage when you save.'
                  : 'Current saved photo.'}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm mb-4">
            <input
              type="checkbox"
              checked={form.isVisitor}
              onChange={e => setForm(f => ({ ...f, isVisitor: e.target.checked }))}
              className="rounded border-slate-300"
            />
            Visitor
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!form.name.trim() || saving}
              className="flex-1 rounded-lg bg-primary text-white px-3 py-2 text-sm font-semibold shadow-sm disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingMember ? 'Update' : 'Save'}
            </button>
            {editingMember && (
              <button
                type="button"
                onClick={startAdd}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                Cancel
              </button>
            )}
          </div>
        </section>
      </div>
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
    </main>
  )
}
