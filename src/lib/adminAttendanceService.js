import { supabase } from './supabaseClient'
import { EKKLESIAS, EKKLESIA_BY_ID, KAMPO_BY_ID } from '../constants/kampos'

/**
 * Normalise a raw attendance/member row to its ekklesia id.
 * Handles both new rows (kampo_id = ekklesia id) and old-style rows.
 */
export function normalizeEkklesiaId(row) {
  const kid = row.kampo_id || ''
  if (EKKLESIA_BY_ID[kid]) return kid
  // legacy name fallback
  const name = (row.kampo || '').toLowerCase().trim()
  const found = EKKLESIAS.find(
    e => e.name.toLowerCase() === name || e.id === name
  )
  return found?.id ?? null
}

/**
 * Fetch all attendance records between two ISO date strings (inclusive),
 * across ALL ekklesias — used by the admin analytics charts.
 */
export async function fetchAttendanceForDateRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('attendance')
    .select('date_iso, kampo_id, kampo, member_id, join_type')
    .gte('date_iso', startDate)
    .lte('date_iso', endDate)

  if (error) throw error
  return data || []
}

/**
 * Fetch all attendance records for a single date across ALL ekklesias.
 * Includes join_type so admin can break down Online / Face to Face / SVJ.
 */
export async function fetchAttendanceByDateAllKampos(dateISO) {
  const { data, error } = await supabase
    .from('attendance')
    .select('kampo_id, kampo, join_type, member_id, member_name')
    .eq('date_iso', dateISO)
    .order('kampo_id', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Fetch Total Registered Members (TRM) per ekklesia.
 * Returns an object keyed by ekklesia id: { shiloh_1: 12, tagum_city: 8, … }
 */
export async function fetchMemberCountsAllKampos() {
  const { data, error } = await supabase
    .from('members')
    .select('kampo_id')

  if (error) throw error

  const counts = {}
  EKKLESIAS.forEach(e => { counts[e.id] = 0 })
  ;(data || []).forEach(row => {
    const eid = row.kampo_id
    if (eid && counts[eid] !== undefined) {
      counts[eid]++
    }
  })
  return counts
}
