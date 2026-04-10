import { supabase } from './supabaseClient'
import { KAMPOS } from '../constants/kampos'

const KAMPO_NAME_BY_ID = KAMPOS.reduce((acc, k) => {
  acc[k.id] = k.name
  return acc
}, {})

function kampoNameFromId(kampoId) {
  return KAMPO_NAME_BY_ID[kampoId] || 'Shiloh'
}

function isMissingKampoIdColumn(error) {
  const msg = String(error?.message || '').toLowerCase()
  return error?.code === '42703' || msg.includes('kampo_id')
}

/** Map a Supabase row → the app's member shape */
function toMember(row) {
  return {
    id:           row.id,
    name:         row.name,
    spiritualName: row.spiritual_name || '',
    gender:       row.gender || 'male',
    isVisitor:    !!row.is_visitor,
    img:          row.img || '',
    short:        row.short || '',
    kampoId:      row.kampo_id || '',
    kampo:        row.kampo || '',
  }
}

/** Map app member shape → Supabase insert/update payload */
function toRow(m, kampoId) {
  return {
    name:          m.name,
    spiritual_name: m.spiritualName || '',
    gender:        m.gender || 'male',
    is_visitor:    !!m.isVisitor,
    img:           m.img || '',
    short:         m.short || '',
    kampo_id:      kampoId || '',
  }
}

export async function fetchMembers(kampoId) {
  const byId = await supabase
    .from('members')
    .select('*')
    .eq('kampo_id', kampoId)
    .order('name', { ascending: true })
  if (!byId.error) return byId.data.map(toMember)
  if (!isMissingKampoIdColumn(byId.error)) throw byId.error

  const kampoName = kampoNameFromId(kampoId)
  const byName = await supabase
    .from('members')
    .select('*')
    .eq('kampo', kampoName)
    .order('name', { ascending: true })
  if (byName.error) throw byName.error
  return byName.data.map(toMember)
}

export async function insertMember(member, kampoId) {
  const byId = await supabase
    .from('members')
    .insert(toRow(member, kampoId))
    .select()
    .single()
  if (!byId.error) return toMember(byId.data)
  if (!isMissingKampoIdColumn(byId.error)) throw byId.error

  const kampoName = kampoNameFromId(kampoId)
  const byName = await supabase
    .from('members')
    .insert({
      name: member.name,
      spiritual_name: member.spiritualName || '',
      gender: member.gender || 'male',
      is_visitor: !!member.isVisitor,
      img: member.img || '',
      short: member.short || '',
      kampo: kampoName,
    })
    .select()
    .single()
  if (byName.error) throw byName.error
  return toMember(byName.data)
}

export async function updateMember(id, member, kampoId) {
  const byId = await supabase
    .from('members')
    .update(toRow(member, kampoId))
    .eq('id', id)
    .eq('kampo_id', kampoId)
    .select()
    .single()
  if (!byId.error) return toMember(byId.data)
  if (!isMissingKampoIdColumn(byId.error)) throw byId.error

  const kampoName = kampoNameFromId(kampoId)
  const byName = await supabase
    .from('members')
    .update({
      name: member.name,
      spiritual_name: member.spiritualName || '',
      gender: member.gender || 'male',
      is_visitor: !!member.isVisitor,
      img: member.img || '',
      short: member.short || '',
      kampo: kampoName,
    })
    .eq('id', id)
    .eq('kampo', kampoName)
    .select()
    .single()
  if (byName.error) throw byName.error
  return toMember(byName.data)
}

export async function deleteMember(id, kampoId) {
  const byId = await supabase
    .from('members')
    .delete()
    .eq('id', id)
    .eq('kampo_id', kampoId)
  if (!byId.error) return
  if (!isMissingKampoIdColumn(byId.error)) throw byId.error

  const kampoName = kampoNameFromId(kampoId)
  const byName = await supabase
    .from('members')
    .delete()
    .eq('id', id)
    .eq('kampo', kampoName)
  if (byName.error) throw byName.error
}

/**
 * Upload a photo File to Supabase Storage bucket "member-photos".
 * Returns the public URL of the uploaded file.
 */
export async function uploadMemberPhoto(file) {
  const ext      = file.name.split('.').pop()
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('member-photos')
    .upload(fileName, file, { upsert: false })

  if (uploadError) throw uploadError

  const { data } = supabase.storage
    .from('member-photos')
    .getPublicUrl(fileName)

  return data.publicUrl
}
