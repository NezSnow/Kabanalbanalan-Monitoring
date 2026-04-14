import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import ConfirmDialog from '../components/ConfirmDialog'
import AttendanceCharts from '../components/AttendanceCharts'
import AttendanceComparison from '../components/AttendanceComparison'
import AdminAttendanceMonitor from '../components/AdminAttendanceMonitor'
import KampoAttendancePanel from '../components/KampoAttendancePanel'
import AdminSidebar from '../components/AdminSidebar'
import { supabase } from '../lib/supabaseClient'
import {
  approveUserById,
  deleteUserById,
  fetchApprovedUsers,
  fetchPendingUsers,
  rejectUserById,
  updateUserById,
} from '../lib/accountService'

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch (_) {}
}

const TAB_LABELS = {
  overview:  'Overview',
  users:     'Total Users',
  analytics: 'Attendance Analytics',
  kampo:     'Kampo Attendance',
  monitor:   'Attendance Monitor',
  accounts:  'Account Requests',
}

// ── User View Modal ────────────────────────────────────────────────────────────
function UserViewModal({ user, onClose }) {
  if (!user) return null
  const fields = [
    { label: 'Full Name',  value: user.name  || '—' },
    { label: 'Email',      value: user.email || '—' },
    { label: 'Kampo',      value: user.kampo || '—' },
    { label: 'Status',     value: user.status || '—' },
    { label: 'Joined',     value: user.created_at ? new Date(user.created_at).toLocaleString() : '—' },
    { label: 'Approved At',value: user.approved_at ? new Date(user.approved_at).toLocaleString() : '—' },
  ]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-lg shrink-0">
              {(user.name || '?')[0].toUpperCase()}
            </div>
            <div>
              <div className="font-bold text-slate-900">{user.name || 'Unknown'}</div>
              <div className="text-xs text-slate-500">{user.email}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center" aria-label="Close">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {fields.map(f => (
            <div key={f.label} className="flex items-start justify-between gap-4">
              <span className="text-xs text-slate-500 font-medium w-24 shrink-0">{f.label}</span>
              <span className="text-sm text-slate-900 font-semibold text-right break-all">{f.value}</span>
            </div>
          ))}
        </div>
        <div className="px-5 pb-4">
          <button type="button" onClick={onClose} className="w-full py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── User Edit Modal ────────────────────────────────────────────────────────────
function UserEditModal({ user, onClose, onSave }) {
  const [name,  setName]  = useState(user?.name  || '')
  const [email, setEmail] = useState(user?.email || '')
  const [kampo, setKampo] = useState(user?.kampo || '')
  const [saving, setSaving] = useState(false)
  const [error, setError]  = useState('')

  if (!user) return null

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required.'); return }
    if (!email.trim()) { setError('Email is required.'); return }
    setSaving(true)
    setError('')
    try {
      await onSave(user.id, { name: name.trim(), email: email.trim(), kampo: kampo.trim() })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <div className="font-bold text-slate-900">Edit User</div>
            <div className="text-xs text-slate-500">Update user account details</div>
          </div>
          <button type="button" onClick={onClose} className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center" aria-label="Close">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
              placeholder="Full name"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
              placeholder="Email address"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Kampo</label>
            <input
              type="text"
              value={kampo}
              onChange={e => setKampo(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
              placeholder="Kampo name"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 transition disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  // Approved & pending users
  const [users, setUsers] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [accountsError, setAccountsError] = useState('')

  // Users tab state
  const [userSearch, setUserSearch] = useState('')
  const [viewingUser, setViewingUser] = useState(null)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  // Notifications & realtime
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [newSignupCount, setNewSignupCount] = useState(0)
  const seenInsertIdsRef = useRef(new Set())

  // Logout
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  // ── Load initial data ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    async function loadAccounts() {
      try {
        setLoadingAccounts(true)
        setAccountsError('')
        const [approved, pending] = await Promise.all([fetchApprovedUsers(), fetchPendingUsers()])
        if (cancelled) return
        setUsers(approved)
        setPendingUsers(pending)
      } catch (_) {
        if (!cancelled) setAccountsError('Unable to load account data.')
      } finally {
        if (!cancelled) setLoadingAccounts(false)
      }
    }
    loadAccounts()
    return () => { cancelled = true }
  }, [])

  // ── Supabase Realtime ──────────────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('admin-app-users-inserts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'app_users' }, (payload) => {
        const newUser = payload.new
        if (newUser.status !== 'pending' || !newUser.id) return
        if (seenInsertIdsRef.current.has(newUser.id)) return
        seenInsertIdsRef.current.add(newUser.id)
        setPendingUsers(prev => prev.some(u => u.id === newUser.id) ? prev : [...prev, newUser])
        setNewSignupCount(c => c + 1)
        setNotifications(prev => ([{
          id: newUser.id,
          type: 'New user pending approval',
          name: newUser.name || 'Unknown user',
          email: newUser.email || '',
          kampo: newUser.kampo || '',
          createdAt: newUser.created_at || new Date().toISOString(),
        }, ...prev].slice(0, 25)))
        playNotificationSound()
        toast.custom((t) => (
          <div
            style={{ opacity: t.visible ? 1 : 0, transform: t.visible ? 'translateX(0)' : 'translateX(calc(100% + 1rem))', transition: 'opacity 200ms ease, transform 220ms ease' }}
            className="flex items-start gap-3 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 w-80"
          >
            <div className="mt-0.5 h-9 w-9 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center shrink-0">
              <svg className="h-4 w-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">New Signup — Pending Approval</div>
              <div className="text-slate-200 text-xs mt-1 font-medium truncate">{newUser.name}</div>
              <div className="text-slate-400 text-xs truncate">{newUser.email}</div>
              {newUser.kampo && <div className="mt-1 inline-flex items-center gap-1 bg-slate-700/60 rounded-full px-2 py-0.5 text-[10px] text-slate-300">🏡 {newUser.kampo}</div>}
            </div>
            <button type="button" onClick={() => toast.dismiss(t.id)} className="shrink-0 text-slate-500 hover:text-white transition-colors mt-0.5" aria-label="Dismiss">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ), { duration: 7000 })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // ── Account request actions ────────────────────────────────────────────
  async function approveUser(id) {
    try {
      const row = await approveUserById(id)
      setUsers(prev => [...prev, row])
      setPendingUsers(prev => prev.filter(u => u.id !== id))
    } catch (_) {
      setAccountsError('Failed to approve. Please refresh and try again.')
    }
  }

  async function rejectUser(id) {
    try {
      await rejectUserById(id)
      setPendingUsers(prev => prev.filter(u => u.id !== id))
    } catch (_) {
      setAccountsError('Failed to reject. Please refresh and try again.')
    }
  }

  // ── User management actions ────────────────────────────────────────────
  async function handleEditSave(id, fields) {
    const updated = await updateUserById(id, fields)
    setUsers(prev => prev.map(u => u.id === id ? updated : u))
    toast.success('User updated successfully.')
  }

  async function handleDeleteConfirm() {
    if (!deleteTargetId) return
    setDeleteBusy(true)
    try {
      await deleteUserById(deleteTargetId)
      setUsers(prev => prev.filter(u => u.id !== deleteTargetId))
      toast.success('User deleted.')
    } catch (_) {
      toast.error('Failed to delete user.')
    } finally {
      setDeleteBusy(false)
      setDeleteTargetId(null)
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────
  function navTo(tab) {
    setActiveTab(tab)
    setSidebarOpen(false)
  }

  // ── Logout ────────────────────────────────────────────────────────────
  async function handleLogoutConfirm() {
    setBusy(true)
    try { await supabase.auth.signOut() } finally {
      localStorage.removeItem('user')
      localStorage.removeItem('role')
      setBusy(false)
      setConfirmOpen(false)
      navigate('/')
    }
  }

  // ── Filtered users for Users tab ──────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase()
    return (
      (u.name  || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.kampo || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="h-[100dvh] overflow-hidden bg-white text-slate-900 font-sans antialiased flex">

      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <AdminSidebar
        activeTab={activeTab}
        sidebarOpen={sidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        pendingCount={pendingUsers.length}
        newSignupCount={newSignupCount}
        onNavTo={navTo}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
        onOverlayClick={() => setSidebarOpen(false)}
        onNotifications={() => { setNotificationsOpen(true); setNewSignupCount(0) }}
        onLogout={() => setConfirmOpen(true)}
      />

      {/* ── Main content ───────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 shrink-0">
          <div className="px-3 py-2 flex items-center justify-between gap-2">
            <button type="button" className="p-2 rounded-lg border border-slate-200" onClick={() => setSidebarOpen(s => !s)}>
              <span className="sr-only">Toggle menu</span>
              <div className="w-5 h-5 grid gap-1">
                <span className="block h-0.5 bg-slate-700" />
                <span className="block h-0.5 bg-slate-700" />
                <span className="block h-0.5 bg-slate-700" />
              </div>
            </button>
            <div className="text-center min-w-0">
              <div className="text-sm font-extrabold tracking-tight text-slate-900 truncate">{TAB_LABELS[activeTab]}</div>
              <div className="text-[10px] text-slate-500">Admin Panel</div>
            </div>
            <button
              type="button"
              onClick={() => { setNotificationsOpen(true); setNewSignupCount(0) }}
              className="relative p-2 rounded-lg border border-slate-200 text-slate-600"
              aria-label="Notifications"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.17V11a6 6 0 10-12 0v3.17c0 .53-.21 1.04-.59 1.42L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
              </svg>
              {newSignupCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-0.5 rounded-full bg-secondary text-white text-[9px] font-bold flex items-center justify-center animate-bounce">
                  {newSignupCount > 99 ? '99+' : newSignupCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Desktop page header */}
        <header className="hidden lg:flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div>
            <div className="text-xl font-extrabold tracking-tight text-slate-900">{TAB_LABELS[activeTab]}</div>
            <div className="mt-1 text-xs text-slate-500">Kabanalbanalan Monitoring System</div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Administrator
          </span>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

            {/* ── Overview ────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Welcome banner */}
                <div className="relative overflow-hidden bg-white border border-slate-200 rounded-custom p-6 shadow-sm">
                  <div className="absolute inset-0 hero-shimmer opacity-60 pointer-events-none" />
                  <div className="relative">
                    <h2 className="text-2xl sm:text-3xl font-extrabold">
                      <span className="bg-gradient-to-r from-secondary via-slate-900 to-secondary bg-clip-text text-transparent">
                        Welcome, Admin!
                      </span>
                    </h2>
                    <div className="mt-2 h-1 w-20 rounded-full bg-secondary/70" />
                    <p className="mt-3 text-slate-500 text-sm sm:text-base">
                      You have full access to the Kabanalbanalan Monitoring System.
                    </p>
                  </div>
                </div>

                {/* Stats cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Total Users — clickable */}
                  <button
                    type="button"
                    onClick={() => navTo('users')}
                    className="relative bg-white border border-slate-200 rounded-custom p-5 shadow-sm overflow-hidden text-left w-full hover:border-secondary/40 hover:shadow-md transition group cursor-pointer"
                  >
                    <div className="text-2xl mb-2">👥</div>
                    <div className="text-2xl font-extrabold text-slate-900">{users.length}</div>
                    <div className="text-sm text-slate-500 mt-0.5">Total Users</div>
                    <div className="mt-2 text-[11px] text-secondary font-semibold group-hover:underline">View all users →</div>
                  </button>

                  {/* Pending Approvals */}
                  <button
                    type="button"
                    onClick={() => navTo('accounts')}
                    className="relative bg-white border border-slate-200 rounded-custom p-5 shadow-sm overflow-hidden text-left w-full hover:border-secondary/40 hover:shadow-md transition group cursor-pointer"
                  >
                    {pendingUsers.length > 0 && (
                      <span className="absolute top-3 right-3 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary" />
                      </span>
                    )}
                    <div className="text-2xl mb-2">📝</div>
                    <div className="text-2xl font-extrabold text-slate-900">{pendingUsers.length}</div>
                    <div className="text-sm text-slate-500 mt-0.5">Pending Approvals</div>
                    <div className="mt-2 text-[11px] text-secondary font-semibold group-hover:underline">View requests →</div>
                  </button>

                  {/* Total Kampos */}
                  <button
                    type="button"
                    onClick={() => navTo('kampo')}
                    className="relative bg-white border border-slate-200 rounded-custom p-5 shadow-sm overflow-hidden text-left w-full hover:border-secondary/40 hover:shadow-md transition group cursor-pointer"
                  >
                    <div className="text-2xl mb-2">🏡</div>
                    <div className="text-2xl font-extrabold text-slate-900">4</div>
                    <div className="text-sm text-slate-500 mt-0.5">Total Kampos</div>
                    <div className="mt-2 text-[11px] text-secondary font-semibold group-hover:underline">View attendance →</div>
                  </button>
                </div>

                {/* Quick nav cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {
                      tab: 'users',
                      title: 'Manage Users',
                      desc: 'View, edit and remove registered user accounts.',
                      icon: (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      ),
                    },
                    {
                      tab: 'analytics',
                      title: 'Attendance Analytics',
                      desc: 'View charts and trends across all kampos.',
                      icon: (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3v18h18" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 14l2-2 3 3 5-7 3 3" />
                        </svg>
                      ),
                    },
                    {
                      tab: 'accounts',
                      title: 'Account Requests',
                      desc: 'Approve or reject pending member signups.',
                      icon: (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.5 11a4 4 0 100-8 4 4 0 000 8z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 8v6m3-3h-6" />
                        </svg>
                      ),
                    },
                  ].map(card => (
                    <button
                      key={card.tab}
                      type="button"
                      onClick={() => navTo(card.tab)}
                      className="bg-white border border-slate-200 rounded-custom p-5 shadow-sm hover:border-secondary/40 hover:shadow-md transition text-left w-full group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary mb-3 group-hover:bg-secondary group-hover:text-white transition">
                        {card.icon}
                      </div>
                      <div className="font-semibold text-slate-900">{card.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{card.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Total Users tab ──────────────────────────────────── */}
            {activeTab === 'users' && (
              <div className="space-y-4">
                {/* Search + count header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Search by name, email or kampo…"
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
                    />
                  </div>
                  <div className="text-sm text-slate-500 shrink-0">
                    {filteredUsers.length} of {users.length} user{users.length !== 1 ? 's' : ''}
                  </div>
                </div>

                {loadingAccounts ? (
                  <div className="py-16 text-center text-slate-500 text-sm">Loading users…</div>
                ) : users.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="text-3xl mb-3">👥</div>
                    <div className="font-semibold text-slate-700">No approved users yet.</div>
                    <div className="text-slate-500 text-sm mt-1">Approved accounts will appear here.</div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-16 text-center text-slate-500 text-sm">No users match your search.</div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-custom overflow-hidden shadow-sm">
                    {/* Table header */}
                    <div className="hidden sm:grid grid-cols-[2fr_2fr_1.5fr_auto] gap-4 px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      <span>Name</span>
                      <span>Email</span>
                      <span>Kampo</span>
                      <span>Actions</span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {filteredUsers.map((u, idx) => (
                        <div
                          key={u.id}
                          className="flex flex-col sm:grid sm:grid-cols-[2fr_2fr_1.5fr_auto] sm:items-center gap-3 px-4 py-3 hover:bg-slate-50 transition"
                        >
                          {/* Avatar + name */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary font-bold text-sm shrink-0">
                              {(u.name || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 text-sm truncate">{u.name || '—'}</div>
                              <div className="text-[10px] text-slate-400 sm:hidden truncate">{u.email}</div>
                            </div>
                          </div>

                          {/* Email (desktop) */}
                          <div className="hidden sm:block text-sm text-slate-600 truncate">{u.email || '—'}</div>

                          {/* Kampo */}
                          <div className="sm:block">
                            {u.kampo ? (
                              <span className="inline-flex items-center gap-1 bg-slate-100 rounded-full px-2 py-0.5 text-[11px] text-slate-600">
                                🏡 {u.kampo}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* View */}
                            <button
                              type="button"
                              onClick={() => setViewingUser(u)}
                              title="View"
                              className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => setEditingUser(u)}
                              title="Edit"
                              className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => setDeleteTargetId(u.id)}
                              title="Delete"
                              className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Attendance Analytics ─────────────────────────────── */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <AttendanceCharts />
                <AttendanceComparison />
              </div>
            )}

            {/* ── Kampo Attendance ─────────────────────────────────── */}
            {activeTab === 'kampo' && <KampoAttendancePanel />}

            {/* ── Attendance Monitor ────────────────────────────────── */}
            {activeTab === 'monitor' && <AdminAttendanceMonitor />}

            {/* ── Account Requests ─────────────────────────────────── */}
            {activeTab === 'accounts' && (
              <section className="bg-white border border-slate-200 rounded-custom p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-slate-900">Pending Account Requests</div>
                    {pendingUsers.length > 0 && (
                      <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold border border-secondary/20">
                        {pendingUsers.length}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">{pendingUsers.length} request(s)</div>
                </div>

                {accountsError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{accountsError}</div>
                )}

                {loadingAccounts ? (
                  <div className="py-10 text-center text-slate-500 text-sm">Loading account requests…</div>
                ) : pendingUsers.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="text-3xl mb-3">✅</div>
                    <div className="text-slate-700 font-semibold">All caught up!</div>
                    <div className="text-slate-500 text-sm mt-1">No pending account requests.</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingUsers.map(u => (
                      <div key={u.id} className="border border-slate-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shrink-0 font-bold text-sm">
                            {(u.name || '?')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 truncate">{u.name}</div>
                            <div className="text-xs text-slate-500 truncate">{u.email}</div>
                            {u.kampo && (
                              <div className="mt-0.5 inline-flex items-center gap-1 bg-slate-100 rounded-full px-2 py-0.5 text-[10px] text-slate-600">
                                🏡 {u.kampo}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button type="button" onClick={() => approveUser(u.id)} className="px-3 py-1.5 text-sm rounded-lg border border-primary/30 text-primary font-semibold hover:bg-primary/5 transition">
                            Approve
                          </button>
                          <button type="button" onClick={() => rejectUser(u.id)} className="px-3 py-1.5 text-sm rounded-lg border border-secondary/30 text-secondary font-semibold hover:bg-secondary/5 transition">
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

          </div>
        </div>
      </div>

      {/* ── Modals & Dialogs ───────────────────────────────────────── */}

      {/* View user */}
      {viewingUser && <UserViewModal user={viewingUser} onClose={() => setViewingUser(null)} />}

      {/* Edit user */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTargetId}
        title="Delete User"
        message="Are you sure you want to permanently delete this user? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTargetId(null)}
        danger
        busy={deleteBusy}
      />

      {/* Logout confirmation */}
      <ConfirmDialog
        open={confirmOpen}
        title="Logout"
        message="Do you want to log out?"
        confirmLabel="Yes"
        cancelLabel="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={() => { if (!busy) setConfirmOpen(false) }}
        danger
        busy={busy}
      />

      {/* Notifications modal */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Close notifications" onClick={() => setNotificationsOpen(false)} />
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                <p className="text-xs text-slate-500">Realtime activity from signups</p>
              </div>
              <button type="button" onClick={() => setNotificationsOpen(false)} className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 flex items-center justify-center" aria-label="Close">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[24rem] overflow-y-auto px-4 py-3 space-y-2">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">No notifications yet.</div>
              ) : (
                notifications.map(item => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex items-center rounded-full bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 text-[11px] font-semibold">{item.type}</span>
                      <span className="text-[11px] text-slate-400 shrink-0">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900 truncate">{item.name}</div>
                    <div className="text-xs text-slate-500 truncate">{item.email}</div>
                    {item.kampo && <div className="text-xs text-slate-500 truncate">{item.kampo}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
