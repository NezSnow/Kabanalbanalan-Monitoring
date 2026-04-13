import { supabase } from './supabaseClient'

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

export async function createPendingUser(user) {
  const payload = {
    name: String(user.name || '').trim(),
    email: normalizeEmail(user.email),
    password: String(user.password || ''),
    kampo_id: String(user.kampo_id || ''),
    kampo: String(user.kampo || ''),
    status: 'pending',
  }

  const { data, error } = await supabase
    .from('app_users')
    .insert(payload)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function fetchPendingUsers() {
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function fetchApprovedUsers() {
  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function approveUserById(id) {
  const { data, error } = await supabase
    .from('app_users')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function rejectUserById(id) {
  const { error } = await supabase
    .from('app_users')
    .delete()
    .eq('id', id)
    .eq('status', 'pending')
  if (error) throw error
}

export async function updateUserById(id, fields) {
  const allowed = {}
  if (fields.name  !== undefined) allowed.name  = String(fields.name  || '').trim()
  if (fields.email !== undefined) allowed.email = normalizeEmail(fields.email)
  if (fields.kampo !== undefined) allowed.kampo = String(fields.kampo || '')
  const { data, error } = await supabase
    .from('app_users')
    .update(allowed)
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw error
  return data
}

export async function deleteUserById(id) {
  const { error } = await supabase
    .from('app_users')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function getAuthStateByCredentials(identifier, password) {
  const email = normalizeEmail(identifier)

  const { data, error } = await supabase
    .from('app_users')
    .select('*')
    .eq('email', email)
    .eq('password', String(password || ''))
    .limit(1)

  if (error) throw error
  const user = data?.[0]
  if (!user) return { state: 'invalid', user: null }
  if (user.status === 'pending') return { state: 'pending', user }
  if (user.status === 'approved') return { state: 'approved', user }
  return { state: 'invalid', user: null }
}
