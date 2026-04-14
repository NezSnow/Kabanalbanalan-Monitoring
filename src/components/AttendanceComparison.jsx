import { useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { KAMPOS } from '../constants/kampos'
import { fetchAttendanceForDateRange } from '../lib/adminAttendanceService'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

/* ── helpers ──────────────────────────────────────────────────────────────── */

function normalizeKampoId(row) {
  if (row.kampo_id) return row.kampo_id
  const name  = (row.kampo || '').toLowerCase().trim()
  const found = KAMPOS.find(k => k.name.toLowerCase() === name || k.id === name)
  return found?.id ?? null
}

function toISODate(d) { return d.toISOString().slice(0, 10) }

function monthRange(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return {
    start: `${yearMonth}-01`,
    end:   `${yearMonth}-${String(lastDay).padStart(2, '0')}`,
  }
}

function monthLabel(yearMonth) {
  const [y, m] = yearMonth.split('-').map(Number)
  return new Date(y, m - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

function pctChange(curr, prev) {
  if (prev === 0 && curr === 0) return null
  if (prev === 0) return { value: 100, dir: 'up' }
  const v = Math.round(((curr - prev) / prev) * 100)
  return { value: Math.abs(v), dir: v >= 0 ? 'up' : 'down' }
}

function todayISO()    { return toISODate(new Date()) }
function thisMonthISO() { return todayISO().slice(0, 7) }
function lastMonthISO() {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return toISODate(d).slice(0, 7)
}

/* ── palette ──────────────────────────────────────────────────────────────── */
const BASE_FONT   = { family: 'Inter, ui-sans-serif, system-ui, sans-serif', size: 12 }
const KAMPO_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899']
const COLOR_A = { bg: 'rgba(99,102,241,0.75)',  border: '#4338ca' }
const COLOR_B = { bg: 'rgba(245,158,11,0.75)',  border: '#b45309' }

/* ══════════════════════════════════════════════════════════════════════════ */
export default function AttendanceComparison() {
  const [mode,        setMode]        = useState('date')        // 'date' | 'month'
  const [kampoFilter, setKampoFilter] = useState('all')
  const [dateA,       setDateA]       = useState(todayISO)
  const [dateB,       setDateB]       = useState(todayISO)
  const [monthA,      setMonthA]      = useState(lastMonthISO)
  const [monthB,      setMonthB]      = useState(thisMonthISO)
  const [recordsA,    setRecordsA]    = useState(null)
  const [recordsB,    setRecordsB]    = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [compared,    setCompared]    = useState(false)

  /* ── fetch ──────────────────────────────────────────────────────────── */
  async function handleCompare() {
    setLoading(true)
    setError('')
    setCompared(true)
    try {
      const [rA, rB] =
        mode === 'date'
          ? await Promise.all([
              fetchAttendanceForDateRange(dateA, dateA),
              fetchAttendanceForDateRange(dateB, dateB),
            ])
          : await Promise.all([
              fetchAttendanceForDateRange(monthRange(monthA).start, monthRange(monthA).end),
              fetchAttendanceForDateRange(monthRange(monthB).start, monthRange(monthB).end),
            ])
      setRecordsA(rA)
      setRecordsB(rB)
    } catch (e) {
      setError(e.message || 'Failed to load data.')
    } finally {
      setLoading(false)
    }
  }

  /* ── filter records by selected kampo ───────────────────────────────── */
  const filteredA = useMemo(() => {
    if (!recordsA) return []
    return kampoFilter === 'all'
      ? recordsA
      : recordsA.filter(r => normalizeKampoId(r) === kampoFilter)
  }, [recordsA, kampoFilter])

  const filteredB = useMemo(() => {
    if (!recordsB) return []
    return kampoFilter === 'all'
      ? recordsB
      : recordsB.filter(r => normalizeKampoId(r) === kampoFilter)
  }, [recordsB, kampoFilter])

  /* ── per-kampo counts ────────────────────────────────────────────────── */
  const countA = useMemo(() => {
    const c = {}
    KAMPOS.forEach(k => { c[k.id] = 0 })
    filteredA.forEach(r => { const id = normalizeKampoId(r); if (id) c[id] = (c[id] || 0) + 1 })
    return c
  }, [filteredA])

  const countB = useMemo(() => {
    const c = {}
    KAMPOS.forEach(k => { c[k.id] = 0 })
    filteredB.forEach(r => { const id = normalizeKampoId(r); if (id) c[id] = (c[id] || 0) + 1 })
    return c
  }, [filteredB])

  const totalA = filteredA.length
  const totalB = filteredB.length
  const diff   = totalB - totalA
  const change = pctChange(totalB, totalA)

  /* ── period labels ────────────────────────────────────────────────────── */
  const lA = mode === 'date' ? dateA   : monthLabel(monthA)
  const lB = mode === 'date' ? dateB   : monthLabel(monthB)

  /* ── chart data ──────────────────────────────────────────────────────── */
  const isSingleKampo = kampoFilter !== 'all'
  const chartLabels   = isSingleKampo
    ? [KAMPOS.find(k => k.id === kampoFilter)?.name ?? kampoFilter]
    : KAMPOS.map(k => k.name)

  const barData = {
    labels: chartLabels,
    datasets: [
      {
        label: lA,
        data: isSingleKampo ? [totalA] : KAMPOS.map(k => countA[k.id] || 0),
        backgroundColor: COLOR_A.bg,
        borderColor:     COLOR_A.border,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.6,
      },
      {
        label: lB,
        data: isSingleKampo ? [totalB] : KAMPOS.map(k => countB[k.id] || 0),
        backgroundColor: COLOR_B.bg,
        borderColor:     COLOR_B.border,
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.6,
      },
    ],
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 12, font: BASE_FONT, padding: 16 } },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} attendee${ctx.parsed.y !== 1 ? 's' : ''}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: BASE_FONT },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      x: { grid: { display: false }, ticks: { font: BASE_FONT } },
    },
  }

  const hasData = recordsA !== null && recordsB !== null

  /* ── render ──────────────────────────────────────────────────────────── */
  return (
    <div className="bg-white border border-slate-200 rounded-custom p-5 shadow-sm space-y-5">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-secondary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        <h3 className="font-bold text-slate-900">Attendance Comparison</h3>
        <span className="text-xs text-slate-400 ml-1">— compare two periods side by side</span>
      </div>

      {/* ── Controls ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end gap-3">

        {/* Mode toggle */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Compare by</span>
          <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
            {[['date', 'Date vs Date'], ['month', 'Month vs Month']].map(([val, label], i) => (
              <button
                key={val}
                type="button"
                onClick={() => setMode(val)}
                className={[
                  'px-3 py-1.5 text-xs font-semibold transition',
                  i > 0 ? 'border-l border-slate-200' : '',
                  mode === val ? 'bg-secondary text-white' : 'bg-white text-slate-600 hover:bg-slate-50',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Period A */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Period A</span>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-sm bg-indigo-500 pointer-events-none" />
            {mode === 'date'
              ? <input type="date"  value={dateA}  onChange={e => setDateA(e.target.value)}  className="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary" />
              : <input type="month" value={monthA} onChange={e => setMonthA(e.target.value)} className="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary" />
            }
          </div>
        </div>

        {/* VS divider */}
        <div className="flex items-end pb-1.5">
          <span className="text-xs font-black text-slate-300 px-1 tracking-widest">VS</span>
        </div>

        {/* Period B */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Period B</span>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-sm bg-amber-500 pointer-events-none" />
            {mode === 'date'
              ? <input type="date"  value={dateB}  onChange={e => setDateB(e.target.value)}  className="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary" />
              : <input type="month" value={monthB} onChange={e => setMonthB(e.target.value)} className="pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary" />
            }
          </div>
        </div>

        {/* Kampo filter */}
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Kampo</span>
          <select
            value={kampoFilter}
            onChange={e => setKampoFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary/30 cursor-pointer"
          >
            <option value="all">All Kampos</option>
            {KAMPOS.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
          </select>
        </div>

        {/* Compare button */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleCompare}
            disabled={loading}
            className="px-5 py-1.5 text-xs font-bold bg-secondary text-white rounded-lg hover:bg-secondary/90 active:scale-[0.98] disabled:opacity-50 transition shadow-sm"
          >
            {loading ? 'Loading…' : 'Compare →'}
          </button>
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────── */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* ── Loading spinner ───────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-slate-400 text-sm">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Comparing attendance…
        </div>
      )}

      {/* ── Empty prompt ──────────────────────────────────────────── */}
      {!loading && !compared && (
        <div className="py-12 text-center text-slate-400 text-sm">
          <svg className="h-9 w-9 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          Select two periods above and click <span className="font-semibold text-secondary">Compare →</span>
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────────── */}
      {!loading && hasData && (
        <div className="space-y-5">

          {/* Period labels row */}
          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold">
              <span className="w-2 h-2 rounded-sm bg-indigo-500 shrink-0" />
              A: {lA}
            </span>
            <span className="text-slate-300 font-black">VS</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
              <span className="w-2 h-2 rounded-sm bg-amber-500 shrink-0" />
              B: {lB}
            </span>
            {kampoFilter !== 'all' && (
              <span className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {KAMPOS.find(k => k.id === kampoFilter)?.name}
              </span>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Period A total */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Period A</div>
              <div className="text-3xl font-black text-indigo-700">{totalA}</div>
              <div className="text-xs text-indigo-400 mt-0.5">attendees</div>
            </div>

            {/* Period B total */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Period B</div>
              <div className="text-3xl font-black text-amber-700">{totalB}</div>
              <div className="text-xs text-amber-400 mt-0.5">attendees</div>
            </div>

            {/* Difference */}
            <div className={[
              'rounded-xl border p-4',
              diff > 0 ? 'border-emerald-200 bg-emerald-50'
              : diff < 0 ? 'border-red-200 bg-red-50'
              : 'border-slate-200 bg-slate-50',
            ].join(' ')}>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Difference</div>
              <div className={[
                'text-3xl font-black',
                diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-600' : 'text-slate-400',
              ].join(' ')}>
                {diff > 0 ? `+${diff}` : diff === 0 ? '0' : diff}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">B vs A</div>
            </div>

            {/* % change */}
            <div className={[
              'rounded-xl border p-4',
              change === null ? 'border-slate-200 bg-slate-50'
              : change.dir === 'up' ? 'border-emerald-200 bg-emerald-50'
              : 'border-red-200 bg-red-50',
            ].join(' ')}>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Change</div>
              <div className={[
                'text-3xl font-black',
                change === null ? 'text-slate-300'
                : change.dir === 'up' ? 'text-emerald-600'
                : 'text-red-600',
              ].join(' ')}>
                {change === null ? '—'
                  : change.dir === 'up' ? `↑${change.value}%`
                  : `↓${change.value}%`}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">% change</div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="pt-1">
            <Bar data={barData} options={barOptions} />
          </div>

          {/* Per-kampo breakdown table — only when All Kampos */}
          {kampoFilter === 'all' && (
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-2">Breakdown per Kampo</div>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left font-semibold text-slate-500 px-4 py-2.5">Kampo</th>
                      <th className="text-right font-semibold text-indigo-500 px-4 py-2.5">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-sm bg-indigo-500" /> A
                        </span>
                      </th>
                      <th className="text-right font-semibold text-amber-500 px-4 py-2.5">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-sm bg-amber-500" /> B
                        </span>
                      </th>
                      <th className="text-right font-semibold text-slate-500 px-4 py-2.5">Diff</th>
                      <th className="text-right font-semibold text-slate-500 px-4 py-2.5">Change</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {KAMPOS.map((k, i) => {
                      const a = countA[k.id] || 0
                      const b = countB[k.id] || 0
                      const d = b - a
                      const c = pctChange(b, a)
                      return (
                        <tr key={k.id} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2 font-semibold text-slate-700">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ background: KAMPO_COLORS[i] }} />
                              {k.name}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-indigo-700">{a}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-amber-700">{b}</td>
                          <td className={[
                            'px-4 py-2.5 text-right font-bold',
                            d > 0 ? 'text-emerald-600' : d < 0 ? 'text-red-500' : 'text-slate-400',
                          ].join(' ')}>
                            {d > 0 ? `+${d}` : d === 0 ? '0' : d}
                          </td>
                          <td className={[
                            'px-4 py-2.5 text-right font-semibold',
                            c === null ? 'text-slate-400' : c.dir === 'up' ? 'text-emerald-600' : 'text-red-500',
                          ].join(' ')}>
                            {c === null ? '—' : c.dir === 'up' ? `↑ +${c.value}%` : `↓ −${c.value}%`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                      <td className="px-4 py-2.5 text-slate-700">Total</td>
                      <td className="px-4 py-2.5 text-right text-indigo-700">{totalA}</td>
                      <td className="px-4 py-2.5 text-right text-amber-700">{totalB}</td>
                      <td className={[
                        'px-4 py-2.5 text-right',
                        diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-slate-400',
                      ].join(' ')}>
                        {diff > 0 ? `+${diff}` : diff === 0 ? '0' : diff}
                      </td>
                      <td className={[
                        'px-4 py-2.5 text-right',
                        change === null ? 'text-slate-400' : change.dir === 'up' ? 'text-emerald-600' : 'text-red-500',
                      ].join(' ')}>
                        {change === null ? '—' : change.dir === 'up' ? `↑ +${change.value}%` : `↓ −${change.value}%`}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
