import { supabase } from './supabaseClient'
import { KAMPOS } from '../constants/kampos'

/**
 * Fetch all attendance records between two ISO date strings (inclusive),
 * across ALL kampos — used by the admin analytics charts.
 *
 * Returns an array of raw Supabase rows:
 *   { date_iso, kampo_id, kampo, member_id }
 */
export async function fetchAttendanceForDateRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('attendance')
    .select('date_iso, kampo_id, kampo, member_id')
    .gte('date_iso', startDate)
    .lte('date_iso', endDate)

  if (error) throw error
  return data || []
}

/**
 * Fetch all attendance records for a single date across ALL kampos.
 * Includes join_type so admin can break down Online / Face to Face / SVJ.
 *
 * Returns rows: { kampo_id, kampo, join_type, member_id, member_name }
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
 * Fetch Total Registered Members (TRM) per kampo.
 * Returns an object keyed by kampo_id: { shiloh: 12, tagum: 8, … }
 */
export async function fetchMemberCountsAllKampos() {
  const { data, error } = await supabase
    .from('members')
    .select('kampo_id')

  if (error) throw error

  const counts = {}
  KAMPOS.forEach(k => { counts[k.id] = 0 })
  ;(data || []).forEach(row => {
    if (row.kampo_id && counts[row.kampo_id] !== undefined) {
      counts[row.kampo_id]++
    }
  })
  return counts
}
