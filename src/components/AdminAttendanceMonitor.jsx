import { useCallback, useEffect, useMemo, useState } from 'react'
import { EKKLESIAS, KAMPOS, ekklesiasForKampo } from '../constants/kampos'
import {
  fetchAttendanceByDateAllKampos,
  fetchMemberCountsAllKampos,
  normalizeEkklesiaId,
} from '../lib/adminAttendanceService'
import { avatarUrl, initialsShortName } from '../utils/helpers'

/* ── helpers ──────────────────────────────────────────────────────────────── */
function toISOToday() { return new Date().toISOString().slice(0, 10) }

/* ── Color tokens (no 'label' or 'value' keys — avoids spread conflicts) ── */
const JOIN_STYLE = {
  'Face to Face': {
    pill:     'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot:      'bg-emerald-500',
    cardText: 'text-emerald-700',
  },
  'Online': {
    pill:     'border-indigo-200 bg-indigo-50 text-indigo-700',
    dot:      'bg-indigo-500',
    cardText: 'text-indigo-700',
  },
  'SVJ': {
    pill:     'border-amber-200 bg-amber-50 text-amber-700',
    dot:      'bg-amber-500',
    cardText: 'text-amber-700',
  },
}

const EKKLESIA_COLORS = [
  '#6366f1', '#818cf8', '#22c55e', '#f59e0b', '#fb923c', '#ec4899', '#a78bfa',
]

/* ── Stat card ─────────────────────────────────────────────────────────────── */
function StatCard({ name, count, cardCls, nameCls, countCls, pulse = false }) {
  return (
    <div className={`relative rounded-xl border p-4 shadow-sm ${cardCls}`}>
      {pulse && (
        <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
      )}
      <div className={`text-[11px] font-semibold uppercase tracking-wider ${nameCls}`}>{name}</div>
      <div className={`text-3xl font-black mt-1 ${countCls}`}>{count}</div>
    </div>
  )
}

/* ── Attendees modal ────────────────────────────────────────────────────────── */
function AttendeesModal({ kampo, attendees, onClose }) {
  const sorted = useMemo(
    () => [...attendees].sort((a, b) => (a.member_name || '').localeCompare(b.member_name || '')),
    [attendees]
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85dvh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
          <div>
            <div className="font-bold text-slate-900">{kampo.name} — Attendees</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {sorted.length} attendee{sorted.length !== 1 ? 's' : ''} on this date
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {sorted.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              No attendance recorded for this kampo.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sorted.map(r => {
                const jt     = r.join_type || 'Face to Face'
                const style  = JOIN_STYLE[jt] || JOIN_STYLE['Face to Face']
                const short  = jt === 'Face to Face' ? 'FTF' : jt
                return (
                  <div
                    key={r.member_id || `${r.member_name}-${r.join_type}`}
                    className="border border-slate-200 rounded-xl p-3 text-center hover:border-secondary/30 hover:bg-secondary/5 transition"
                  >
                    <img
                      className="w-14 h-14 rounded-full object-cover mx-auto mb-2 border border-slate-200"
                      src={avatarUrl(r.member_id)}
                      alt={r.member_name}
                    />
                    <div className="text-xs font-semibold text-slate-900 truncate leading-tight">
                      {r.member_name || '—'}
                    </div>
                    <div className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${style.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                      {short}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function AdminAttendanceMonitor() {
  const [date,        setDate]        = useState(toISOToday)
  const [kampoFilter, setKampoFilter] = useState('all')
  const [rows,        setRows]        = useState([])
  const [trm,         setTrm]         = useState({})
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [modalKampo,  setModalKampo]  = useState(null)

  /* ── filter mode helpers ─────────────────────────────────────────────── */
  const filterKampo = KAMPOS.find(k => k.id === kampoFilter) || null   // kampo-level
  const filterEkk   = EKKLESIAS.find(e => e.id === kampoFilter) || null // ekklesia-level

  /* ── fetch ────────────────────────────────────────────────────────────── */
  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const data = await fetchAttendanceByDateAllKampos(date)
      setRows(data)
      setLastRefresh(new Date())
    } catch (e) {
      setError(e.message || 'Failed to load attendance.')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { load() }, [load])
  useEffect(() => { fetchMemberCountsAllKampos().then(setTrm).catch(() => {}) }, [])
  useEffect(() => {
    const id = setInterval(() => load(true), 30_000)
    return () => clearInterval(id)
  }, [load])

  /* ── derived data ────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    if (kampoFilter === 'all') return rows
    if (filterKampo) {
      const ids = ekklesiasForKampo(filterKampo.id).map(e => e.id)
      return rows.filter(r => ids.includes(normalizeEkklesiaId(r)))
    }
    return rows.filter(r => normalizeEkklesiaId(r) === kampoFilter)
  }, [rows, kampoFilter, filterKampo])

  const totals = useMemo(() => {
    let ftf = 0, online = 0, svj = 0
    filtered.forEach(r => {
      if      (r.join_type === 'Face to Face') ftf++
      else if (r.join_type === 'Online')       online++
      else if (r.join_type === 'SVJ')          svj++
    })
    let trmTotal
    if (kampoFilter === 'all') {
      trmTotal = EKKLESIAS.reduce((s, e) => s + (trm[e.id] || 0), 0)
    } else if (filterKampo) {
      trmTotal = ekklesiasForKampo(filterKampo.id).reduce((s, e) => s + (trm[e.id] || 0), 0)
    } else {
      trmTotal = trm[kampoFilter] || 0
    }
    return { overall: filtered.length, ftf, online, svj, trm: trmTotal }
  }, [filtered, trm, kampoFilter, filterKampo])

  // Per-KAMPO summary cards (shown in "All" view)
  const perKampoSummary = useMemo(() => KAMPOS.map(k => {
    const ekks  = ekklesiasForKampo(k.id)
    const kRows = rows.filter(r => ekks.some(e => e.id === normalizeEkklesiaId(r)))
    let ftf = 0, online = 0, svj = 0
    kRows.forEach(r => {
      if      (r.join_type === 'Face to Face') ftf++
      else if (r.join_type === 'Online')       online++
      else if (r.join_type === 'SVJ')          svj++
    })
    const kampoTrm = ekks.reduce((s, e) => s + (trm[e.id] || 0), 0)
    return { kampo: k, ekks, total: kRows.length, ftf, online, svj, trm: kampoTrm, rows: kRows }
  }), [rows, trm])

  // Per-EKKLESIA cards (shown in kampo-level view)
  const perEkklesiaInKampo = useMemo(() => {
    if (!filterKampo) return []
    return ekklesiasForKampo(filterKampo.id).map(e => {
      const eRows = rows.filter(r => normalizeEkklesiaId(r) === e.id)
      let ftf = 0, online = 0, svj = 0
      eRows.forEach(r => {
        if      (r.join_type === 'Face to Face') ftf++
        else if (r.join_type === 'Online')       online++
        else if (r.join_type === 'SVJ')          svj++
      })
      return { ekklesia: e, total: eRows.length, ftf, online, svj, trm: trm[e.id] || 0, rows: eRows }
    })
  }, [rows, trm, filterKampo])

  // Attendee list for ekklesia view (or kampo view combined)
  const attendeeList = useMemo(() => {
    if (kampoFilter === 'all') return []
    return [...filtered].sort((a, b) => (a.member_name || '').localeCompare(b.member_name || ''))
  }, [filtered, kampoFilter])

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ── Greeting banner ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-white border border-slate-200 rounded-custom p-6 shadow-sm">
        <div className="absolute inset-0 hero-shimmer opacity-60 pointer-events-none" />
        <div className="relative">
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            <span className="bg-gradient-to-r from-secondary via-slate-900 to-secondary bg-clip-text text-transparent">
              Shalom, Brother Heder!
            </span>
          </h2>
          <div className="mt-2 h-1 w-24 rounded-full bg-secondary/70" />
          <p className="mt-3 text-slate-500 text-sm">
            Here's the live attendance snapshot for today.
            {lastRefresh && (
              <span className="ml-2 text-slate-400 text-xs">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ── Controls ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Date picker */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Worship date</span>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary"
          />
        </div>

        {/* Filter */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-500">Filter by Kampo / Ekklesia</span>
          <div className="flex flex-wrap items-center gap-1.5">

            {/* All */}
            <button
              type="button"
              onClick={() => setKampoFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${kampoFilter === 'all' ? 'bg-secondary text-white border-secondary' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              All
            </button>

            <span className="text-slate-200 text-sm font-light">|</span>

            {/* Kampo buttons + their ekklesias */}
            {KAMPOS.map(kampo => (
              <div key={kampo.id} className="flex items-center gap-1">
                {/* Clickable kampo name = province total */}
                <button
                  type="button"
                  onClick={() => setKampoFilter(kampo.id)}
                  className={[
                    'px-3 py-1.5 text-xs font-bold rounded-lg border transition',
                    kampoFilter === kampo.id
                      ? 'bg-primary text-white border-primary'
                      : 'bg-primary/8 text-primary border-primary/30 hover:bg-primary/15',
                  ].join(' ')}
                  title={`View total for ${kampo.name}`}
                >
                  {kampo.name}
                </button>
                <svg className="h-3 w-3 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                {/* Individual ekklesias */}
                {ekklesiasForKampo(kampo.id).map(e => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setKampoFilter(e.id)}
                    className={[
                      'px-3 py-1.5 text-xs font-semibold rounded-lg border transition',
                      kampoFilter === e.id
                        ? 'bg-secondary text-white border-secondary'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    {e.name}
                  </button>
                ))}
                <span className="text-slate-200 text-sm font-light mx-1">|</span>
              </div>
            ))}
          </div>
        </div>

        {/* Refresh */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => load(false)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
          >
            <svg className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Error ─────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* ── Spinner ───────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-sm">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading attendance…
        </div>
      )}

      {!loading && (
        <>
          {/* ── Summary stat cards ────────────────────────────────────── */}
          {/* Active filter label */}
          {kampoFilter !== 'all' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Showing results for:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-bold">
                {filterKampo ? filterKampo.name : filterEkk?.name}
                {filterKampo && <span className="text-secondary/60 font-normal ml-1">— all ekklesias combined</span>}
              </span>
              <button
                type="button"
                onClick={() => setKampoFilter('all')}
                className="text-xs text-slate-400 hover:text-slate-600 underline transition ml-1"
              >
                Clear
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard
              name="Total today"  count={totals.overall}
              cardCls="border-slate-200 bg-white" nameCls="text-slate-500" countCls="text-slate-900"
              pulse={totals.overall > 0}
            />
            <StatCard
              name="Face to Face" count={totals.ftf}
              cardCls="border-emerald-200 bg-emerald-50" nameCls="text-emerald-600" countCls="text-emerald-700"
            />
            <StatCard
              name="Online"       count={totals.online}
              cardCls="border-indigo-200 bg-indigo-50"   nameCls="text-indigo-500"  countCls="text-indigo-700"
            />
            <StatCard
              name="SVJ"          count={totals.svj}
              cardCls="border-amber-200 bg-amber-50"     nameCls="text-amber-500"   countCls="text-amber-700"
            />
            <StatCard
              name={filterKampo ? `TRM · ${filterKampo.name}` : filterEkk ? `TRM · ${filterEkk.name}` : 'TRM · All'}
              count={totals.trm}
              cardCls="border-secondary/20 bg-secondary/5" nameCls="text-secondary/70" countCls="text-secondary"
            />
          </div>

          {/* ════════════════════════════════════════════════════
              VIEW A: All → 3 Kampo summary cards (clickable)
          ════════════════════════════════════════════════════ */}
          {kampoFilter === 'all' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {perKampoSummary.map((pk, i) => {
                const rate = pk.trm > 0 ? Math.round((pk.total / pk.trm) * 100) : null
                const KAMPO_COLORS = ['#6366f1', '#22c55e', '#f59e0b']
                return (
                  <div
                    key={pk.kampo.id}
                    className="bg-white border border-slate-200 rounded-custom p-5 shadow-sm"
                  >
                    {/* Kampo header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: KAMPO_COLORS[i] }} />
                        <div className="font-bold text-slate-900 text-sm">{pk.kampo.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-slate-900">{pk.total}</div>
                        <div className="text-[11px] text-slate-400">of {pk.trm} TRM</div>
                      </div>
                    </div>

                    {/* Ekklesia sub-totals */}
                    <div className="space-y-1 mb-3">
                      {pk.ekks.map(e => {
                        const eRows = rows.filter(r => normalizeEkklesiaId(r) === e.id)
                        return (
                          <div key={e.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">{e.name}</span>
                            <span className="font-bold text-slate-800">{eRows.length}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Join-type pills */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {[
                        { name: 'FTF',    count: pk.ftf,    jt: 'Face to Face' },
                        { name: 'Online', count: pk.online, jt: 'Online'       },
                        { name: 'SVJ',    count: pk.svj,    jt: 'SVJ'          },
                      ].map(s => (
                        <span key={s.name}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${JOIN_STYLE[s.jt].pill}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${JOIN_STYLE[s.jt].dot}`} />
                          {s.name}: {s.count}
                        </span>
                      ))}
                      {pk.total === 0 && <span className="text-xs text-slate-400 italic">No attendance yet</span>}
                    </div>

                    {/* Progress bar */}
                    {rate !== null && (
                      <div className="mb-3">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span>Attendance rate</span>
                          <span className={rate >= 75 ? 'text-emerald-600 font-bold' : rate >= 50 ? 'text-amber-600 font-bold' : 'text-red-500 font-bold'}>
                            {rate}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(rate, 100)}%`, background: KAMPO_COLORS[i] }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Drill-down button */}
                    <button
                      type="button"
                      onClick={() => setKampoFilter(pk.kampo.id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-secondary/30 hover:text-secondary transition"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                      View {pk.kampo.name} breakdown
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* ════════════════════════════════════════════════════
              VIEW B: Kampo selected → per-ekklesia breakdown
          ════════════════════════════════════════════════════ */}
          {filterKampo && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {perEkklesiaInKampo.map((pe, i) => {
                  const rate = pe.trm > 0 ? Math.round((pe.total / pe.trm) * 100) : null
                  return (
                    <div key={pe.ekklesia.id} className="bg-white border border-slate-200 rounded-custom p-5 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: EKKLESIA_COLORS[i] }} />
                          <div className="font-bold text-slate-900 text-sm">{pe.ekklesia.name}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black text-slate-900">{pe.total}</div>
                          <div className="text-[11px] text-slate-400">of {pe.trm} TRM</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {[
                          { name: 'FTF',    count: pe.ftf,    jt: 'Face to Face' },
                          { name: 'Online', count: pe.online, jt: 'Online'       },
                          { name: 'SVJ',    count: pe.svj,    jt: 'SVJ'          },
                        ].map(s => (
                          <span key={s.name}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${JOIN_STYLE[s.jt].pill}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${JOIN_STYLE[s.jt].dot}`} />
                            {s.name}: {s.count}
                          </span>
                        ))}
                        {pe.total === 0 && <span className="text-xs text-slate-400 italic">No attendance yet</span>}
                      </div>

                      {rate !== null && (
                        <div className="mb-3">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Attendance rate</span>
                            <span className={rate >= 75 ? 'text-emerald-600 font-bold' : rate >= 50 ? 'text-amber-600 font-bold' : 'text-red-500 font-bold'}>
                              {rate}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${rate >= 75 ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                              style={{ width: `${Math.min(rate, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setModalKampo({ kampo: pe.ekklesia, rows: pe.rows })}
                        disabled={pe.total === 0}
                        className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-secondary/30 hover:text-secondary disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {pe.total === 0 ? 'No attendees' : `View ${pe.total} Attendee${pe.total !== 1 ? 's' : ''}`}
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Combined attendee tiles for entire kampo */}
              {attendeeList.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-custom p-4 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="font-bold text-slate-900">All Attendees — {filterKampo.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Combined from all ekklesias in this kampo</div>
                    </div>
                    <div className="text-xs text-slate-500">{attendeeList.length} total</div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {attendeeList.map(r => {
                      const jt    = r.join_type || 'Face to Face'
                      const style = JOIN_STYLE[jt] || JOIN_STYLE['Face to Face']
                      const short = jt === 'Face to Face' ? 'FTF' : jt
                      const eid   = normalizeEkklesiaId(r)
                      const ekk   = EKKLESIAS.find(e => e.id === eid)
                      return (
                        <div key={r.member_id || `${r.member_name}-${r.join_type}`}
                          className="border border-slate-200 rounded-xl p-3 text-center hover:border-secondary/30 hover:bg-secondary/5 transition"
                        >
                          <img className="w-12 h-12 rounded-full object-cover mx-auto mb-2 border border-slate-200"
                            src={avatarUrl(r.member_id)} alt={r.member_name} />
                          <div className="text-xs font-semibold text-slate-900 truncate">{initialsShortName(r.member_name || '')}</div>
                          {ekk && <div className="text-[10px] text-slate-400 mt-0.5 truncate">{ekk.name}</div>}
                          <div className={`mt-0.5 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${style.pill}`}>
                            <span className={`w-1 h-1 rounded-full shrink-0 ${style.dot}`} />{short}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════════════════════════════════════════════════════
              VIEW C: Ekklesia selected → attendee tiles
          ════════════════════════════════════════════════════ */}
          {filterEkk && (
            <div className="bg-white border border-slate-200 rounded-custom p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-slate-900">Attendees — {filterEkk.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {KAMPOS.find(k => k.id === filterEkk.kampoId)?.name}
                  </div>
                </div>
                <div className="text-xs text-slate-500">{attendeeList.length} record{attendeeList.length !== 1 ? 's' : ''}</div>
              </div>

              {attendeeList.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">
                  No attendance recorded for {filterEkk.name} on {date}.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {attendeeList.map(r => {
                    const jt    = r.join_type || 'Face to Face'
                    const style = JOIN_STYLE[jt] || JOIN_STYLE['Face to Face']
                    const short = jt === 'Face to Face' ? 'FTF' : jt
                    return (
                      <div key={r.member_id || `${r.member_name}-${r.join_type}`}
                        className="border border-slate-200 rounded-xl p-3 text-center hover:border-secondary/30 hover:bg-secondary/5 transition"
                      >
                        <img className="w-12 h-12 rounded-full object-cover mx-auto mb-2 border border-slate-200"
                          src={avatarUrl(r.member_id)} alt={r.member_name} />
                        <div className="text-xs font-semibold text-slate-900 truncate">{initialsShortName(r.member_name || '')}</div>
                        <div className={`mt-0.5 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${style.pill}`}>
                          <span className={`w-1 h-1 rounded-full shrink-0 ${style.dot}`} />{short}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Attendees modal ────────────────────────────────────────────── */}
      {modalKampo && (
        <AttendeesModal
          kampo={modalKampo.kampo}
          attendees={modalKampo.rows}
          onClose={() => setModalKampo(null)}
        />
      )}
    </div>
  )
}
