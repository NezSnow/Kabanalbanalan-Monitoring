import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar'
import AttendanceKiosk from './components/AttendanceKiosk'
import ManageMembers from './components/ManageMembers'
import Monitoring from './components/Monitoring'
import {
  fetchMembers,
  insertMember,
  updateMember as updateMemberSvc,
  deleteMember as deleteMemberSvc,
} from './lib/membersService'
import { fetchAllAttendance, insertAttendance } from './lib/attendanceService'
import { toISODate, formatHeaderTime } from './utils/helpers'
import { KAMPO_BY_NAME } from './constants/kampos'

export default function App({ onLogout }) {
  const [activeTab,       setActiveTab]       = useState('attendance')
  const [sidebarOpen,     setSidebarOpen]     = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [now,             setNow]             = useState(() => new Date())

  // ── Data ──────────────────────────────────────────────────────────────
  const [members,        setMembers]        = useState([])
  const [attendance,     setAttendance]     = useState([])
  const [membersLoading, setMembersLoading] = useState(true)
  const [membersError,   setMembersError]   = useState(null)
  const [attendanceLoading, setAttendanceLoading] = useState(true)
  const selectedKampo = localStorage.getItem('selectedKampo') || ''
  const selectedKampoId = localStorage.getItem('selectedKampoId')
    || localStorage.getItem('kampo_id')
    || KAMPO_BY_NAME[selectedKampo.toLowerCase()]?.id
    || ''

  // ── Clock ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // ── Fetch members ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedKampoId) {
      setMembers([])
      setMembersError(null)
      setMembersLoading(false)
      return
    }
    setMembersLoading(true)
    fetchMembers(selectedKampoId)
      .then(setMembers)
      .catch(err => setMembersError(err.message))
      .finally(() => setMembersLoading(false))
  }, [selectedKampoId])

  // ── Fetch all attendance (all dates, filter in memory) ────────────────
  useEffect(() => {
    if (!selectedKampoId) {
      setAttendance([])
      setAttendanceLoading(false)
      return
    }
    setAttendanceLoading(true)
    fetchAllAttendance(selectedKampoId)
      .then(setAttendance)
      .catch(console.error)
      .finally(() => setAttendanceLoading(false))
  }, [selectedKampoId])

  // ── Navigation ────────────────────────────────────────────────────────
  function navTo(tab) {
    setActiveTab(tab)
    setSidebarOpen(false)
  }

  // ── Member CRUD ───────────────────────────────────────────────────────
  async function handleAddMember(memberData) {
    const inserted = await insertMember(memberData, selectedKampoId)
    setMembers(prev =>
      [...prev, inserted].sort((a, b) => a.name.localeCompare(b.name))
    )
    return inserted
  }

  async function handleUpdateMember(id, memberData) {
    const updated = await updateMemberSvc(id, memberData, selectedKampoId)
    setMembers(prev => prev.map(m => (m.id === id ? updated : m)))
    return updated
  }

  async function handleDeleteMember(id) {
    await deleteMemberSvc(id, selectedKampoId)
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  // ── Attendance record ─────────────────────────────────────────────────
  async function handleAttendanceRecorded(record) {
    const inserted = await insertAttendance(record, selectedKampoId)
    setAttendance(prev => [inserted, ...prev])
    return inserted
  }

  const sidebarWidthClass = sidebarCollapsed ? 'w-72 lg:w-20' : 'w-72 lg:w-72'

  const tabLabel = activeTab === 'attendance'
    ? 'Kabanalbanalan Attendance'
    : activeTab === 'manage'
      ? 'Manage Kapatid'
      : 'Monitoring'
  const currentKampoLabel = selectedKampo || (selectedKampoId ? selectedKampoId.toUpperCase() : 'Unknown Kampo')

  return (
    <div className="h-[100dvh] overflow-hidden bg-white text-slate-900 font-sans antialiased flex flex-col">
      {/* ── Mobile top bar ─────────────────────────────────────────── */}
      <div className="lg:hidden shrink-0 sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="px-3 py-2 flex items-center justify-between">
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
          <div className="text-center">
            <div className="text-sm font-extrabold tracking-tight text-slate-900">Church Attendance</div>
            <div className="mt-0.5 inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              Kampo: {currentKampoLabel}
            </div>
          </div>
          <div className="text-xs text-slate-500">{formatHeaderTime(now)}</div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ── Sidebar ──────────────────────────────────────────────── */}
        <Sidebar
          activeTab={activeTab}
          sidebarOpen={sidebarOpen}
          sidebarCollapsed={sidebarCollapsed}
          sidebarWidthClass={sidebarWidthClass}
          now={now}
          onNavTo={navTo}
          onToggleCollapse={() => setSidebarCollapsed(v => !v)}
          onOverlayClick={() => setSidebarOpen(false)}
          onLogout={onLogout}
        />

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
          {/* Desktop header */}
          <header className="hidden lg:block bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-extrabold tracking-tight text-slate-900">{tabLabel}</div>
                <div className="mt-1 inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  Kampo: {currentKampoLabel}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{formatHeaderTime(now)}</div>
                <div className="text-xs text-slate-400">Main Sanctuary</div>
              </div>
            </div>
          </header>

          {/* Error banner */}
          {membersError && (
            <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              ⚠️ Failed to load members: {membersError}
              <br />
              Check your <code>.env</code> file and Supabase project settings.
            </div>
          )}

          {activeTab === 'attendance' && (
            <AttendanceKiosk
              members={members}
              attendance={attendance}
              membersLoading={membersLoading}
              attendanceLoading={attendanceLoading}
              onAttendanceRecorded={handleAttendanceRecorded}
            />
          )}

          {activeTab === 'manage' && (
            <ManageMembers
              members={members}
              onAdd={handleAddMember}
              onUpdate={handleUpdateMember}
              onDelete={handleDeleteMember}
            />
          )}

          {activeTab === 'monitoring' && (
            <Monitoring attendance={attendance} />
          )}
        </div>
      </div>
    </div>
  )
}
