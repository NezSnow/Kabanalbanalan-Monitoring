import { useEffect, useMemo, useRef, useState } from 'react'
import JoinModal from './modals/JoinModal'
import SuccessModal from './modals/SuccessModal'
import {
  toISODate,
  initialsShortName,
  spiritualDisplayName,
  spiritualTileLines,
  formatTimestamp,
  avatarUrl,
} from '../utils/helpers'

export default function AttendanceKiosk({
  members,
  attendance,
  membersLoading,
  attendanceLoading,
  onAttendanceRecorded,
}) {
  const [worshipDate,      setWorshipDate]      = useState(() => toISODate(new Date()))
  const [selectedId,       setSelectedId]       = useState(null)
  const [memberSearch,     setMemberSearch]     = useState('')
  const [isJoinOpen,       setIsJoinOpen]       = useState(false)
  const [isSuccessOpen,    setIsSuccessOpen]    = useState(false)
  const [attendanceType,   setAttendanceType]   = useState('Face to Face')
  const [timestamp,        setTimestamp]        = useState('')
  const [saving,           setSaving]           = useState(false)
  const successTimerRef = useRef(null)

  // Cleanup timer on unmount
  useEffect(() => () => {
    if (successTimerRef.current) clearTimeout(successTimerRef.current)
  }, [])

  // ── Derived data ────────────────────────────────────────────────────
  const attendedIds = useMemo(() => {
    const s = new Set()
    attendance.forEach(r => {
      if (r.dateISO === worshipDate && r.memberId) s.add(r.memberId)
    })
    return s
  }, [attendance, worshipDate])

  const quickTotals = useMemo(() => {
    let overall = 0, ftf = 0, online = 0, svj = 0, visitors = 0
    attendance.forEach(r => {
      if (r.dateISO !== worshipDate) return
      overall++
      if (r.isVisitor) visitors++
      if (r.joinType === 'Face to Face') ftf++
      else if (r.joinType === 'Online')  online++
      else if (r.joinType === 'SVJ')     svj++
    })
    return { overall, ftf, online, svj, visitors }
  }, [attendance, worshipDate])

  const sortedMembers = useMemo(() =>
    [...members].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
  , [members])

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase()
    const base = sortedMembers.filter(m => {
      if (!q) return true
      return m.name.toLowerCase().includes(q) || (m.spiritualName || '').toLowerCase().includes(q)
    })
    return base.sort((a, b) => {
      const aA = attendedIds.has(a.id)
      const bA = attendedIds.has(b.id)
      if (aA === bA) return 0
      return aA ? 1 : -1
    })
  }, [sortedMembers, memberSearch, attendedIds])

  const suggestions = useMemo(() => {
    const q = memberSearch.trim().toLowerCase()
    if (!q) return []
    return sortedMembers
      .filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.spiritualName || '').toLowerCase().includes(q)
      )
      .slice(0, 8)
  }, [sortedMembers, memberSearch])

  const selectedMember = useMemo(() => members.find(m => m.id === selectedId) || null, [members, selectedId])
  const canConfirm     = !!selectedId && !attendedIds.has(selectedId) && !saving

  // ── Actions ─────────────────────────────────────────────────────────
  function resetKiosk() {
    setIsJoinOpen(false)
    setIsSuccessOpen(false)
    if (successTimerRef.current) clearTimeout(successTimerRef.current)
    setAttendanceType('Face to Face')
    setTimestamp('')
    setMemberSearch('')
    setSelectedId(null)
  }

  async function handleTypePick(type) {
    if (!selectedMember) return
    setSaving(true)
    try {
      const ts = formatTimestamp(new Date())
      setTimestamp(ts)
      setAttendanceType(type)
      setIsJoinOpen(false)

      await onAttendanceRecorded({
        dateISO:     worshipDate,
        joinType:    type,
        memberId:    selectedMember.id,
        memberName:  selectedMember.name,
        memberShort: selectedMember.short || initialsShortName(selectedMember.name),
        gender:      selectedMember.gender,
        isVisitor:   !!selectedMember.isVisitor,
        img:         selectedMember.img || '',
      })

      setIsSuccessOpen(true)
      successTimerRef.current = setTimeout(() => {
        setIsSuccessOpen(false)
        setAttendanceType('Face to Face')
        setTimestamp('')
        setSelectedId(null)
      }, 1200)
    } catch (err) {
      console.error('Failed to save attendance:', err)
      alert('Failed to record attendance. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const isLoading = membersLoading || attendanceLoading

  return (
    <div className="min-h-full flex flex-col">
      {/* Worship date picker */}
      <div className="px-3 sm:px-6 pt-4 sm:pt-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-start mb-4">
            <div className="text-sm text-slate-600">Worship date:</div>
            <input
              type="date"
              value={worshipDate}
              onChange={e => { setWorshipDate(e.target.value); setSelectedId(null) }}
              className="w-full sm:w-auto rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <main className="px-3 sm:px-6 pb-48 flex-1">
        <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:gap-6">

          {/* ── Hero / counter section ── */}
          <section className="relative overflow-hidden bg-white rounded-custom border border-slate-200 p-4 sm:p-6 shadow-sm animate-float-in">
            <div className="absolute inset-0 hero-shimmer opacity-80" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-secondary via-slate-900 to-secondary bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(0,0,0,0.06)]">
                  Shalom Kapatid!
                </span>
              </h2>
              <div className="mt-2 h-1 w-24 sm:w-28 rounded-full bg-primary shadow-[0_0_22px_rgba(212,175,55,0.35)]" />
              <p className="mt-3 text-slate-600 text-base sm:text-lg">
                Please select your name for attendance
              </p>

              {/* Live counters */}
              <div className="mt-4 grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs sm:text-sm">
                <div className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2">
                  <div className="text-slate-500">Total today</div>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {isLoading ? '…' : quickTotals.overall}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2">
                  <div className="text-slate-500">Face to Face</div>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {isLoading ? '…' : quickTotals.ftf}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2">
                  <div className="text-slate-500">Online</div>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {isLoading ? '…' : quickTotals.online}
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2">
                  <div className="text-slate-500">SVJ</div>
                  <div className="text-lg sm:text-xl font-extrabold text-slate-900">
                    {isLoading ? '…' : quickTotals.svj}
                  </div>
                </div>
                <div className="rounded-lg border border-teal-200 bg-teal-50/70 px-3 py-2">
                  <div className="text-teal-600 font-semibold">Visitors</div>
                  <div className="text-lg sm:text-xl font-extrabold text-teal-700">
                    {isLoading ? '…' : quickTotals.visitors}
                  </div>
                </div>
                <div className="rounded-lg border border-violet-200 bg-violet-50/70 px-3 py-2">
                  <div className="text-violet-600 font-semibold">TRM</div>
                  <div className="text-lg sm:text-xl font-extrabold text-violet-700">
                    {membersLoading ? '…' : members.length}
                  </div>
                </div>
              </div>

              {selectedMember ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-secondary/15 bg-primary/10 px-3 py-1 text-sm text-slate-800">
                  <span className="h-2 w-2 rounded-full bg-secondary" />
                  Selected:{' '}
                  <span className="font-semibold">{spiritualDisplayName(selectedMember)}</span>
                  {selectedMember.isVisitor && (
                    <span className="ml-2 text-xs text-secondary font-semibold">(Visitor)</span>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Tap your tile below to enable{' '}
                  <span className="font-semibold">Confirm Attendance</span>.
                </p>
              )}
            </div>
          </section>

          {/* ── Member grid ── */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 sm:mb-4">
              Select Member
            </h3>

            {/* Search */}
            <div className="mb-3 sm:mb-4 relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M11 18a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" />
              </svg>
              <input
                value={memberSearch}
                onChange={e => setMemberSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && suggestions.length) {
                    e.preventDefault()
                    setSelectedId(suggestions[0].id)
                  }
                }}
                placeholder="Search member name…"
                className="w-full rounded-lg border border-slate-200 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
              />

              {/* Suggestions dropdown */}
              {suggestions.length > 0 && memberSearch.trim() && (
                <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
                  <div className="max-h-64 overflow-auto">
                    {suggestions.map(m => {
                      const lines = spiritualTileLines(m)
                      return (
                        <button
                          key={m.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 active:bg-slate-100 flex items-center gap-3"
                          onClick={() => { setSelectedId(m.id); setMemberSearch('') }}
                        >
                          <img
                            src={m.img || avatarUrl(m.id)}
                            alt={m.name}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold text-slate-900 truncate">{lines.top}</div>
                            {lines.bottom && (
                              <div className="text-[11px] text-slate-500 truncate">{lines.bottom}</div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Loading skeleton */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="border rounded-custom p-3 sm:p-4 flex flex-col items-center gap-3 animate-pulse">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100" />
                    <div className="h-3 w-20 bg-slate-100 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {filteredMembers.map(m => {
                  const isSelected = selectedId === m.id
                  const isAttended = attendedIds.has(m.id)
                  const lines      = spiritualTileLines(m)
                  return (
                    <button
                      key={m.id}
                      type="button"
                      disabled={isAttended || saving}
                      onClick={() => setSelectedId(m.id)}
                      className={[
                        'relative border rounded-custom p-3 sm:p-4 flex flex-col items-center text-center transition',
                        'hover:shadow-sm active:scale-[0.99]',
                        isAttended
                          ? 'bg-primary/15 border-primary text-slate-700 opacity-90 cursor-not-allowed hover:shadow-none active:scale-100'
                          : 'bg-white border-slate-200 hover:border-primary/60',
                        !isAttended && isSelected ? 'border-primary ring-2 ring-primary/40' : '',
                      ].join(' ')}
                    >
                      <img
                        alt={m.name}
                        src={m.img || avatarUrl(m.id)}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full mb-3 object-cover"
                      />
                      <div className="w-full flex flex-col items-center">
                        <div className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight">
                          {lines.top}
                        </div>
                        {lines.bottom && (
                          <>
                            <div className="mt-2 mb-2 h-px w-16 sm:w-20 bg-slate-900/70" />
                            <div className="tracking-wide text-[11px] sm:text-xs text-slate-700">
                              {lines.bottom}
                            </div>
                          </>
                        )}
                      </div>
                      {m.isVisitor && !isAttended && (
                        <span className="mt-1 text-[10px] font-semibold text-secondary">VISITOR</span>
                      )}
                      {isAttended ? (
                        <span className="absolute -top-2 -right-2 bg-primary text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow">
                          DONE
                        </span>
                      ) : isSelected ? (
                        <span className="absolute -top-2 -right-2 bg-secondary text-white p-1 rounded-full shadow">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" clipRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                          </svg>
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            )}

            {!isLoading && !filteredMembers.length && memberSearch && (
              <div className="mt-4 text-sm text-slate-500 text-center">
                No members found for "{memberSearch}".
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ── Sticky footer ── */}
      <footer className="sticky bottom-0 bg-white border-t border-slate-200 p-3 sm:p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
        <div className="max-w-5xl mx-auto flex flex-col gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsJoinOpen(true)}
            disabled={!canConfirm}
            className="w-full py-2.5 sm:py-3 px-4 bg-primary text-white text-sm sm:text-base font-bold rounded-lg shadow-sm active:scale-[0.98] transition-transform saturate-theme disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {saving ? 'SAVING…' : 'CONFIRM ATTENDANCE'}
          </button>
          <button
            type="button"
            onClick={resetKiosk}
            className="w-full py-2.5 sm:py-3 px-4 bg-white text-secondary text-sm sm:text-base font-semibold rounded-lg border border-secondary/30 hover:bg-secondary/5 active:bg-secondary/10 transition-colors"
          >
            Clear Selection
          </button>
        </div>
      </footer>

      {/* ── Modals ── */}
      {isJoinOpen && (
        <JoinModal
          member={selectedMember}
          onPick={handleTypePick}
          onCancel={() => setIsJoinOpen(false)}
        />
      )}

      {isSuccessOpen && (
        <SuccessModal
          member={selectedMember}
          attendanceType={attendanceType}
          timestamp={timestamp}
        />
      )}
    </div>
  )
}
