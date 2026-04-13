import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import ConfirmDialog from '../components/ConfirmDialog'
import AttendanceCharts from '../components/AttendanceCharts'
import KampoAttendancePanel from '../components/KampoAttendancePanel'
import AdminSidebar from '../components/AdminSidebar'
import { supabase } from '../lib/supabaseClient'
import {
  approveUserById,
  fetchApprovedUsers,
  fetchPendingUsers,
  rejectUserById,
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
  } catch (_) {
    // Ignore if audio is blocked or unavailable
  }
}

const TAB_LABELS = {
  overview: 'Overview',
  analytics: 'Attendance Analytics',
  kampo: 'Kampo Attendance',
  accounts: 'Account Requests',
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [users, setUsers] = useState([])
  const [pendingUsers, setPendingUsers] = useState([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [accountsError, setAccountsError] = useState('')
  const [newSignupCount, setNewSignupCount] = useState(0)
  const seenInsertIdsRef = useRef(new Set())

  // Load initial data
  useEffect(() => {
    let cancelled = false

    async function loadAccounts() {
      try {
        setLoadingAccounts(true)
        setAccountsError('')
        const [approved, pending] = await Promise.all([
          fetchApprovedUsers(),
          fetchPendingUsers(),
        ])
        if (cancelled) return
        setUsers(approved)
        setPendingUsers(pending)
      } catch (_err) {
        if (cancelled) return
        setAccountsError('Unable to load account requests.')
      } finally {
        if (!cancelled) setLoadingAccounts(false)
      }
    }

    loadAccounts()
    return () => { cancelled = true }
  }, [])

  // Supabase Realtime — listen for new pending signups on app_users
  useEffect(() => {
    const channel = supabase
      .channel('admin-app-users-inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'app_users' },
        (payload) => {
          const newUser = payload.new
          if (newUser.status !== 'pending') return
          if (!newUser.id) return

          if (seenInsertIdsRef.current.has(newUser.id)) return
          seenInsertIdsRef.current.add(newUser.id)

          setPendingUsers(prev =>
            prev.some(u => u.id === newUser.id) ? prev : [...prev, newUser]
          )

          setNewSignupCount(c => c + 1)

          setNotifications(prev => ([
            {
              id: newUser.id,
              type: 'New user pending approval',
              name: newUser.name || 'Unknown user',
              email: newUser.email || '',
              kampo: newUser.kampo || '',
              createdAt: newUser.created_at || new Date().toISOString(),
            },
            ...prev,
          ].slice(0, 25)))

          playNotificationSound()

          toast.custom(
            (t) => (
              <div
                style={{
                  opacity: t.visible ? 1 : 0,
                  transform: t.visible ? 'translateX(0)' : 'translateX(calc(100% + 1rem))',
                  transition: 'opacity 200ms ease, transform 220ms ease',
                }}
                className="flex items-start gap-3 bg-slate-800 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 w-80"
              >
                <div className="mt-0.5 h-9 w-9 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center shrink-0">
                  <svg className="h-4 w-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm leading-tight">New Signup — Pending Approval</div>
                  <div className="text-slate-200 text-xs mt-1 font-medium truncate">{newUser.name}</div>
                  <div className="text-slate-400 text-xs truncate">{newUser.email}</div>
                  {newUser.kampo && (
                    <div className="mt-1 inline-flex items-center gap-1 bg-slate-700/60 rounded-full px-2 py-0.5 text-[10px] text-slate-300">
                      🏡 {newUser.kampo}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  className="shrink-0 text-slate-500 hover:text-white transition-colors mt-0.5"
                  aria-label="Dismiss"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ),
            { duration: 7000 }
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  function persistState(approved, pending) {
    setUsers(approved)
    setPendingUsers(pending)
  }

  async function approveUser(id) {
    const target = pendingUsers.find(u => u.id === id)
    if (!target) return
    try {
      const approvedRow = await approveUserById(id)
      persistState([...users, approvedRow], pendingUsers.filter(u => u.id !== id))
    } catch (_err) {
      setAccountsError('Failed to approve account. Please refresh and try again.')
    }
  }

  async function rejectUser(id) {
    try {
      await rejectUserById(id)
      persistState(users, pendingUsers.filter(u => u.id !== id))
    } catch (_err) {
      setAccountsError('Failed to reject account. Please refresh and try again.')
    }
  }

  function navTo(tab) {
    setActiveTab(tab)
    setSidebarOpen(false)
  }

  function requestLogout() {
    setConfirmOpen(true)
  }

  async function handleLogoutConfirm() {
    setBusy(true)
    try {
      await supabase.auth.signOut()
    } finally {
      localStorage.removeItem('user')
      localStorage.removeItem('role')
      setBusy(false)
      setConfirmOpen(false)
      navigate('/')
    }
  }

  function handleLogoutCancel() {
    if (busy) return
    setConfirmOpen(false)
  }

  function openNotificationsModal() {
    setNotificationsOpen(true)
    setNewSignupCount(0)
  }

  function closeNotificationsModal() {
    setNotificationsOpen(false)
  }

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
        onNotifications={openNotificationsModal}
        onLogout={requestLogout}
      />

      {/* ── Main content ───────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 shrink-0">
          <div className="px-3 py-2 flex items-center justify-between gap-2">
            <button
              type="button"
              className="p-2 rounded-lg border border-slate-200"
              onClick={() => setSidebarOpen(s => !s)}
            >
              <span className="sr-only">Toggle menu</span>
              <div className="w-5 h-5 grid gap-1">
                <span className="block h-0.5 bg-slate-700" />
                <span className="block h-0.5 bg-slate-700" />
                <span className="block h-0.5 bg-slate-700" />
              </div>
            </button>
            <div className="text-center min-w-0">
              <div className="text-sm font-extrabold tracking-tight text-slate-900 truncate">
                {TAB_LABELS[activeTab]}
              </div>
              <div className="text-[10px] text-slate-500">Admin Panel</div>
            </div>
            {/* Notification bell (mobile) */}
            <button
              type="button"
              onClick={openNotificationsModal}
              className="relative p-2 rounded-lg border border-slate-200 text-slate-600"
              aria-label="Notifications"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M15 17h5l-1.4-1.4A2 2 0 0118 14.17V11a6 6 0 10-12 0v3.17c0 .53-.21 1.04-.59 1.42L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
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
            <div className="text-xl font-extrabold tracking-tight text-slate-900">
              {TAB_LABELS[activeTab]}
            </div>
            <div className="mt-1 text-xs text-slate-500">Kabanalbanalan Monitoring System</div>
          </div>
          <div className="flex items-center gap-2">
            {/* Admin badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/25 bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Administrator
            </span>
          </div>
        </header>

        {/* Scrollable page content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

            {/* ── Overview ──────────────────────────────────────── */}
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
                  {[
                    { label: 'Total Members',     value: users.length,        icon: '👥', pulse: false, tab: null },
                    { label: 'Pending Approvals', value: pendingUsers.length, icon: '📝', pulse: pendingUsers.length > 0, tab: 'accounts' },
                    { label: 'Total Kampos',      value: '4',                 icon: '🏡', pulse: false, tab: 'kampo' },
                  ].map(c => (
                    <button
                      key={c.label}
                      type="button"
                      onClick={() => c.tab && navTo(c.tab)}
                      className={[
                        'relative bg-white border border-slate-200 rounded-custom p-5 shadow-sm overflow-hidden text-left w-full',
                        c.tab ? 'hover:border-secondary/40 hover:shadow-md transition cursor-pointer' : 'cursor-default',
                      ].join(' ')}
                    >
                      {c.pulse && (
                        <span className="absolute top-3 right-3 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary" />
                        </span>
                      )}
                      <div className="text-2xl mb-2">{c.icon}</div>
                      <div className="text-2xl font-extrabold text-slate-900">{c.value}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{c.label}</div>
                      {c.tab && (
                        <div className="mt-2 text-[11px] text-secondary font-semibold">View →</div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Quick nav cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
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
                      tab: 'kampo',
                      title: 'Kampo Attendance',
                      desc: 'Browse attendance records by kampo and date.',
                      icon: (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      ),
                    },
                    {
                      tab: 'accounts',
                      title: 'Account Requests',
                      desc: 'Approve or reject pending member signups.',
                      icon: (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M8.5 11a4 4 0 100-8 4 4 0 000 8z" />
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

            {/* ── Analytics ─────────────────────────────────────── */}
            {activeTab === 'analytics' && (
              <AttendanceCharts />
            )}

            {/* ── Kampo Attendance ──────────────────────────────── */}
            {activeTab === 'kampo' && (
              <KampoAttendancePanel />
            )}

            {/* ── Account Requests ──────────────────────────────── */}
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
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {accountsError}
                  </div>
                )}

                {loadingAccounts ? (
                  <div className="py-10 text-center text-slate-500 text-sm">Loading account requests...</div>
                ) : pendingUsers.length === 0 ? (
                  <div className="py-14 text-center">
                    <div className="text-3xl mb-3">✅</div>
                    <div className="text-slate-700 font-semibold">All caught up!</div>
                    <div className="text-slate-500 text-sm mt-1">No pending account requests.</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pendingUsers.map(u => (
                      <div
                        key={u.id}
                        className="border border-slate-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
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
                          <button
                            type="button"
                            onClick={() => approveUser(u.id)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-primary/30 text-primary font-semibold hover:bg-primary/5 transition"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => rejectUser(u.id)}
                            className="px-3 py-1.5 text-sm rounded-lg border border-secondary/30 text-secondary font-semibold hover:bg-secondary/5 transition"
                          >
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

      {/* ── Dialogs ────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirmOpen}
        title="Logout"
        message="Do you want to log out?"
        confirmLabel="Yes"
        cancelLabel="Cancel"
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        danger
        busy={busy}
      />

      {/* ── Notifications Modal ────────────────────────────────────── */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close notifications"
            onClick={closeNotificationsModal}
          />
          <div className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                <p className="text-xs text-slate-500">Realtime activity from signups</p>
              </div>
              <button
                type="button"
                onClick={closeNotificationsModal}
                className="h-8 w-8 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                aria-label="Close"
              >
                <svg className="h-4 w-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[24rem] overflow-y-auto px-4 py-3 space-y-2">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">
                  No notifications yet.
                </div>
              ) : (
                notifications.map(item => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex items-center rounded-full bg-secondary/10 text-secondary border border-secondary/20 px-2 py-0.5 text-[11px] font-semibold">
                        {item.type}
                      </span>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
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
