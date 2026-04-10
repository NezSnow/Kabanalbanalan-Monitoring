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

/** Map a Supabase row → app attendance record shape */
function toRecord(row) {
  return {
    id:          row.id,
    dateISO:     row.date_iso,
    createdAt:   row.created_at,
    joinType:    row.join_type,
    memberId:    row.member_id,
    memberName:  row.member_name,
    memberShort: row.member_short || '',
    gender:      row.gender || '',
    isVisitor:   !!row.is_visitor,
    img:         row.img || '',
    kampoId:     row.kampo_id || '',
    kampo:       row.kampo || '',
  }
}

/** Fetch ALL attendance records (all dates). Used to seed local state on mount. */
export async function fetchAllAttendance(kampoId) {
  const byId = await supabase
    .from('attendance')
    .select('*')
    .eq('kampo_id', kampoId)
    .order('created_at', { ascending: false })
  if (!byId.error) return byId.data.map(toRecord)
  if (!isMissingKampoIdColumn(byId.error)) throw byId.error

  const kampoName = kampoNameFromId(kampoId)
  const byName = await supabase
    .from('attendance')
    .select('*')
    .eq('kampo', kampoName)
    .order('created_at', { ascending: false })
  if (byName.error) throw byName.error
  return byName.data.map(toRecord)
}

/** Fetch attendance for one specific date (YYYY-MM-DD). */
export async function fetchAttendanceByDate(dateISO, kampoId) {
  const byId = await supabase
    .from('attendance')
    .select('*')
    .eq('date_iso', dateISO)
    .eq('kampo_id', kampoId)
    .order('created_at', { ascending: false })
  if (!byId.error) return byId.data.map(toRecord)
  if (!isMissingKampoIdColumn(byId.error)) throw byId.error

  const kampoName = kampoNameFromId(kampoId)
  const byName = await supabase
    .from('attendance')
    .select('*')
    .eq('date_iso', dateISO)
    .eq('kampo', kampoName)
    .order('created_at', { ascending: false })
  if (byName.error) throw byName.error
  return byName.data.map(toRecord)
}

/** Insert one attendance record and return the saved row. */
export async function insertAttendance(record, kampoId) {
  const byId = await supabase
    .from('attendance')
    .insert({
      date_iso:     record.dateISO,
      join_type:    record.joinType,
      member_id:    record.memberId,
      member_name:  record.memberName,
      member_short: record.memberShort || '',
      gender:       record.gender || '',
      is_visitor:   !!record.isVisitor,
      img:          record.img || '',
      kampo_id:     kampoId || '',
    })
    .select()
    .single()
  if (!byId.error) return toRecord(byId.data)
  if (!isMissingKampoIdColumn(byId.error)) throw byId.error

  const kampoName = kampoNameFromId(kampoId)
  const byName = await supabase
    .from('attendance')
    .insert({
      date_iso:     record.dateISO,
      join_type:    record.joinType,
      member_id:    record.memberId,
      member_name:  record.memberName,
      member_short: record.memberShort || '',
      gender:       record.gender || '',
      is_visitor:   !!record.isVisitor,
      img:          record.img || '',
      kampo:        kampoName,
    })
    .select()
    .single()
  if (byName.error) throw byName.error
  return toRecord(byName.data)
}
