import { supabase } from './supabaseClient'

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
