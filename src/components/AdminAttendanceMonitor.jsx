import { useCallback, useEffect, useMemo, useState } from 'react'
import { KAMPOS } from '../constants/kampos'
import {
  fetchAttendanceByDateAllKampos,
  fetchMemberCountsAllKampos,
} from '../lib/adminAttendanceService'
import { avatarUrl, initialsShortName } from '../utils/helpers'

/* ── helpers ──────────────────────────────────────────────────────────────── */
function toISOToday() { return new Date().toISOString().slice(0, 10) }

function normalizeKampoId(row) {
  if (row.kampo_id) return row.kampo_id
  const name  = (row.kampo || '').toLowerCase().trim()
  const found = KAMPOS.find(k => k.name.toLowerCase() === name || k.id === name)
  return found?.id ?? null
}

const JOIN_COLORS = {
  'Face to Face': { card: 'border-emerald-200 bg-emerald-50', label: 'text-emerald-600', value: 'text-emerald-700' },
  'Online':       { card: 'border-indigo-200  bg-indigo-50',  label: 'text-indigo-500',  value: 'text-indigo-700'  },
  'SVJ':          { card: 'border-amber-200   bg-amber-50',   label: 'text-amber-500',   value: 'text-amber-700'   },
}

const KAMPO_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899']

/* ── Stat card ────────────────────────────────────────────────────────────── */
function StatCard({ label, value, colorCard = 'border-slate-200 bg-white', colorLabel = 'text-slate-500', colorValue = 'text-slate-900', pulse = false }) {
  return (
    <div className={`relative rounded-xl border p-4 shadow-sm ${colorCard}`}>
      {pulse && (
        <span className="absolute top-2.5 right-2.5 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
      )}
      <div className={`text-[11px] font-semibold uppercase tracking-wider ${colorLabel}`}>{label}</div>
      <div className={`text-3xl font-black mt-1 ${colorValue}`}>{value}</div>
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

  /* ── fetch ──────────────────────────────────────────────────────────── */
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

  // Initial + date-change fetch
  useEffect(() => { load() }, [load])

  // TRM — fetch once
  useEffect(() => {
    fetchMemberCountsAllKampos().then(setTrm).catch(() => {})
  }, [])

  // Auto-refresh every 30 s
  useEffect(() => {
    const id = setInterval(() => load(true), 30_000)
    return () => clearInterval(id)
  }, [load])

  /* ── filter rows by selected kampo ──────────────────────────────────── */
  const filtered = useMemo(() => {
    if (kampoFilter === 'all') return rows
    return rows.filter(r => normalizeKampoId(r) === kampoFilter)
  }, [rows, kampoFilter])

  /* ── overall totals ──────────────────────────────────────────────────── */
  const totals = useMemo(() => {
    let ftf = 0, online = 0, svj = 0
    filtered.forEach(r => {
      if (r.join_type === 'Face to Face') ftf++
      else if (r.join_type === 'Online')  online++
      else if (r.join_type === 'SVJ')     svj++
    })
    const trmTotal = kampoFilter === 'all'
      ? KAMPOS.reduce((s, k) => s + (trm[k.id] || 0), 0)
      : (trm[kampoFilter] || 0)
    return { overall: filtered.length, ftf, online, svj, trm: trmTotal }
  }, [filtered, trm, kampoFilter])

  /* ── per-kampo aggregation (only when "all") ─────────────────────────── */
  const perKampo = useMemo(() => {
    return KAMPOS.map(k => {
      const kRows = rows.filter(r => normalizeKampoId(r) === k.id)
      let ftf = 0, online = 0, svj = 0
      kRows.forEach(r => {
        if (r.join_type === 'Face to Face') ftf++
        else if (r.join_type === 'Online')  online++
        else if (r.join_type === 'SVJ')     svj++
      })
      return { kampo: k, total: kRows.length, ftf, online, svj, trm: trm[k.id] || 0, rows: kRows }
    })
  }, [rows, trm])

  /* ── attendee list for single-kampo view ────────────────────────────── */
  const attendeeList = useMemo(() => {
    if (kampoFilter === 'all') return []
    return [...filtered].sort((a, b) => (a.member_name || '').localeCompare(b.member_name || ''))
  }, [filtered, kampoFilter])

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">

      {/* ── Greeting banner ──────────────────────────────────────────── */}
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

      {/* ── Controls ─────────────────────────────────────────────────── */}
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

        {/* Kampo filter */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Kampo</span>
          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setKampoFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold transition ${kampoFilter === 'all' ? 'bg-secondary text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              All Kampos
            </button>
            {KAMPOS.map((k, i) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKampoFilter(k.id)}
                className={[
                  'px-3 py-1.5 text-xs font-semibold border-l border-slate-200 transition',
                  kampoFilter === k.id ? 'bg-secondary text-white' : 'bg-white text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                {k.name}
              </button>
            ))}
          </div>
        </div>

        {/* Refresh button */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => load(false)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
          >
            <svg
              className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* ── Loading skeleton ──────────────────────────────────────────── */}
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
          {/* ── Summary stat cards ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <StatCard
              label="Total today"
              value={totals.overall}
              pulse={totals.overall > 0}
              colorCard="border-slate-200 bg-white"
              colorLabel="text-slate-500"
              colorValue="text-slate-900"
            />
            <StatCard
              label="Face to Face"
              value={totals.ftf}
              colorCard={JOIN_COLORS['Face to Face'].card}
              colorLabel={JOIN_COLORS['Face to Face'].label}
              colorValue={JOIN_COLORS['Face to Face'].value}
            />
            <StatCard
              label="Online"
              value={totals.online}
              colorCard={JOIN_COLORS['Online'].card}
              colorLabel={JOIN_COLORS['Online'].label}
              colorValue={JOIN_COLORS['Online'].value}
            />
            <StatCard
              label="SVJ"
              value={totals.svj}
              colorCard={JOIN_COLORS['SVJ'].card}
              colorLabel={JOIN_COLORS['SVJ'].label}
              colorValue={JOIN_COLORS['SVJ'].value}
            />
            <StatCard
              label="TRM"
              value={totals.trm}
              colorCard="border-secondary/20 bg-secondary/5"
              colorLabel="text-secondary/70"
              colorValue="text-secondary"
            />
          </div>

          {/* ── All Kampos: per-kampo breakdown ───────────────────────── */}
          {kampoFilter === 'all' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {perKampo.map((pk, i) => (
                <div
                  key={pk.kampo.id}
                  className="bg-white border border-slate-200 rounded-custom p-5 shadow-sm"
                >
                  {/* Kampo header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ background: KAMPO_COLORS[i] }}
                      />
                      <div>
                        <div className="font-bold text-slate-900">{pk.kampo.name}</div>
                        {pk.kampo.sub && (
                          <div className="text-[11px] text-slate-400">{pk.kampo.sub}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-slate-900">{pk.total}</div>
                      <div className="text-[11px] text-slate-400">of {pk.trm} TRM</div>
                    </div>
                  </div>

                  {/* Mini stat pills */}
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'FTF',    value: pk.ftf,    ...JOIN_COLORS['Face to Face'] },
                      { label: 'Online', value: pk.online, ...JOIN_COLORS['Online']       },
                      { label: 'SVJ',    value: pk.svj,    ...JOIN_COLORS['SVJ']          },
                    ].map(s => (
                      <div
                        key={s.label}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${s.card} ${s.value}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.label === 'FTF' ? 'bg-emerald-500' : s.label === 'Online' ? 'bg-indigo-500' : 'bg-amber-500'}`} />
                        {s.label}: {s.value}
                      </div>
                    ))}
                    {pk.total === 0 && (
                      <span className="text-xs text-slate-400 italic">No attendance yet</span>
                    )}
                  </div>

                  {/* Progress bar (attended / TRM) */}
                  {pk.trm > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Attendance rate</span>
                        <span>{Math.round((pk.total / pk.trm) * 100)}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.round((pk.total / pk.trm) * 100))}%`,
                            background: KAMPO_COLORS[i],
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Single kampo: attendee list ───────────────────────────── */}
          {kampoFilter !== 'all' && (
            <div className="bg-white border border-slate-200 rounded-custom p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="font-bold text-slate-900">Attendees</div>
                <div className="text-xs text-slate-500">
                  {attendeeList.length} record{attendeeList.length !== 1 ? 's' : ''}
                </div>
              </div>

              {attendeeList.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm">
                  No attendance recorded for this kampo on {date}.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {attendeeList.map(r => (
                    <div
                      key={r.member_id || `${r.member_name}-${r.join_type}`}
                      className="border border-slate-200 rounded-xl p-3 text-center hover:border-secondary/30 hover:bg-secondary/5 transition"
                    >
                      <img
                        className="w-12 h-12 rounded-full object-cover mx-auto mb-2 border border-slate-200"
                        src={avatarUrl(r.member_id)}
                        alt={r.member_name}
                      />
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {initialsShortName(r.member_name || '')}
                      </div>
                      <div className={[
                        'mt-0.5 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold',
                        r.join_type === 'Face to Face' ? 'bg-emerald-100 text-emerald-700'
                        : r.join_type === 'Online'     ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-amber-100 text-amber-700',
                      ].join(' ')}>
                        {r.join_type === 'Face to Face' ? 'FTF' : r.join_type}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
