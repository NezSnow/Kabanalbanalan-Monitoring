import { useEffect, useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { EKKLESIAS, KAMPOS, ekklesiasForKampo } from '../constants/kampos'
import { fetchAttendanceForDateRange, normalizeEkklesiaId } from '../lib/adminAttendanceService'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler
)

/* ── Colour palette — 7 ekklesias ──────────────────────────────────────── */
const EKKLESIA_COLORS = [
  { solid: '#6366f1', faded: 'rgba(99,102,241,0.18)',   border: '#4f46e5' },  // shiloh_1
  { solid: '#818cf8', faded: 'rgba(129,140,248,0.18)',  border: '#6366f1' },  // shiloh_2
  { solid: '#22c55e', faded: 'rgba(34,197,94,0.18)',    border: '#16a34a' },  // tagum_city
  { solid: '#f59e0b', faded: 'rgba(245,158,11,0.18)',   border: '#d97706' },  // samuag
  { solid: '#fb923c', faded: 'rgba(251,146,60,0.18)',   border: '#ea580c' },  // rizal
  { solid: '#ec4899', faded: 'rgba(236,72,153,0.18)',   border: '#db2777' },  // mapula
  { solid: '#a78bfa', faded: 'rgba(167,139,250,0.18)',  border: '#7c3aed' },  // salapawan
]

const EKKLESIA_SHORT = EKKLESIAS.map(e => e.name)
const DAY_LABELS     = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/* ── Date helpers ─────────────────────────────────────────────────────── */
function getWeekDates(weeksAgo = 0) {
  const now    = new Date()
  const dow    = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((dow + 6) % 7) - weeksAgo * 7)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().slice(0, 10)
  })
}

/* ── % change helper ──────────────────────────────────────────────────── */
function pctChange(curr, prev) {
  if (prev === 0 && curr === 0) return null
  if (prev === 0) return { value: 100, dir: 'up' }
  const v = Math.round(((curr - prev) / prev) * 100)
  return { value: Math.abs(v), dir: v >= 0 ? 'up' : 'down', raw: v }
}

const BASE_FONT = { family: 'Inter, ui-sans-serif, system-ui, sans-serif', size: 12 }

/* ═══════════════════════════════════════════════════════════════════════ */
export default function AttendanceCharts() {
  const [records,     setRecords]     = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [err,         setErr]         = useState(null)
  const [filterType,  setFilterType]  = useState('all')    // 'all' | kampo id | ekklesia id
  const [filterScope, setFilterScope] = useState('ekklesia') // 'ekklesia' | 'kampo'

  const thisWeekDays = useMemo(() => getWeekDates(0), [])
  const lastWeekDays = useMemo(() => getWeekDates(1), [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setErr(null)
        const data = await fetchAttendanceForDateRange(lastWeekDays[0], thisWeekDays[6])
        if (!cancelled) setRecords(data)
      } catch (e) {
        if (!cancelled) setErr(e.message || 'Failed to load attendance data.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])                     // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Crunch numbers ─────────────────────────────────────────────────── */
  const stats = useMemo(() => {
    if (!records) return null

    const thisWeekByEkk = {}
    const lastWeekByEkk = {}
    const byDay         = {}

    EKKLESIAS.forEach(e => {
      thisWeekByEkk[e.id] = 0
      lastWeekByEkk[e.id] = 0
    })
    thisWeekDays.forEach(d => { byDay[d] = 0 })

    for (const row of records) {
      const eid = normalizeEkklesiaId(row)
      if (!eid) continue

      if (thisWeekDays.includes(row.date_iso)) {
        thisWeekByEkk[eid] = (thisWeekByEkk[eid] || 0) + 1
        byDay[row.date_iso] = (byDay[row.date_iso] || 0) + 1
      } else if (lastWeekDays.includes(row.date_iso)) {
        lastWeekByEkk[eid] = (lastWeekByEkk[eid] || 0) + 1
      }
    }

    return { thisWeekByEkk, lastWeekByEkk, byDay }
  }, [records, thisWeekDays, lastWeekDays])

  /* ── Filter-aware daily trend ───────────────────────────────────────── */
  const filteredDailyData = useMemo(() => {
    if (!records) return []
    return thisWeekDays.map(d => {
      let count = 0
      records.forEach(r => {
        if (r.date_iso !== d) return
        if (filterType === 'all') { count++; return }
        const eid = normalizeEkklesiaId(r)
        if (!eid) return
        if (filterScope === 'ekklesia') {
          if (eid === filterType) count++
        } else {
          // filter by parent kampo
          const ekk = EKKLESIAS.find(e => e.id === eid)
          if (ekk?.kampoId === filterType) count++
        }
      })
      return count
    })
  }, [records, thisWeekDays, filterType, filterScope])

  /* ── Loading / error ────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        Loading analytics…
      </div>
    )
  }

  if (err) {
    return (
      <div className="py-10 text-center text-red-500 text-sm">
        <p className="font-semibold">Could not load chart data.</p>
        <p className="mt-1 text-slate-500">{err}</p>
      </div>
    )
  }

  if (!stats) return null

  /* ── Chart 1: Weekly Comparison (Grouped Bar) — per ekklesia ──────── */
  const weeklyBarData = {
    labels: EKKLESIA_SHORT,
    datasets: [
      {
        label: 'This Week',
        data: EKKLESIAS.map(e => stats.thisWeekByEkk[e.id] || 0),
        backgroundColor: EKKLESIA_COLORS.map(c => c.solid),
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.55,
      },
      {
        label: 'Last Week',
        data: EKKLESIAS.map(e => stats.lastWeekByEkk[e.id] || 0),
        backgroundColor: EKKLESIA_COLORS.map(c => c.faded),
        borderColor: EKKLESIA_COLORS.map(c => c.border),
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.55,
      },
    ],
  }

  const weeklyBarOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: { boxWidth: 12, font: BASE_FONT, padding: 16 },
      },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y} attendee${ctx.parsed.y !== 1 ? 's' : ''}`,
          afterLabel: ctx => {
            const ekk = EKKLESIAS[ctx.dataIndex]
            const kampo = KAMPOS.find(k => k.id === ekk?.kampoId)
            return kampo ? `  Kampo: ${kampo.name}` : ''
          },
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

  /* ── Chart 2: Doughnut by ekklesia ───────────────────────────────── */
  const totalThisWeek = EKKLESIAS.reduce(
    (sum, e) => sum + (stats.thisWeekByEkk[e.id] || 0), 0
  )
  const doughnutData = {
    labels: EKKLESIAS.map(e => e.name),
    datasets: [{
      data: EKKLESIAS.map(e => stats.thisWeekByEkk[e.id] || 0),
      backgroundColor: EKKLESIA_COLORS.map(c => c.solid),
      borderColor: '#ffffff',
      borderWidth: 3,
      hoverOffset: 10,
    }],
  }
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 10,
          font: BASE_FONT,
          padding: 12,
          usePointStyle: true,
          pointStyleWidth: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: ctx => {
            const pct = totalThisWeek ? Math.round((ctx.parsed / totalThisWeek) * 100) : 0
            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`
          },
        },
      },
    },
  }

  /* ── Chart 3: Daily Trend (Line) ─────────────────────────────────── */
  const selectedColor = filterType === 'all'
    ? { solid: '#6366f1', faded: 'rgba(99,102,241,0.12)' }
    : filterScope === 'ekklesia'
      ? EKKLESIA_COLORS[EKKLESIAS.findIndex(e => e.id === filterType)] || EKKLESIA_COLORS[0]
      : { solid: '#22c55e', faded: 'rgba(34,197,94,0.12)' }

  const lineData = {
    labels: DAY_LABELS,
    datasets: [{
      label: 'Attendance',
      data: filteredDailyData,
      borderColor: selectedColor.solid,
      backgroundColor: selectedColor.faded,
      pointBackgroundColor: selectedColor.solid,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
      pointHoverRadius: 7,
      tension: 0.4,
      fill: true,
    }],
  }
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => ` ${ctx.parsed.y} attendee${ctx.parsed.y !== 1 ? 's' : ''}`,
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

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div className="space-y-4 mb-6">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        <h3 className="font-bold text-slate-900">Attendance Analytics</h3>
        <span className="text-xs text-slate-400 ml-1">— this week vs last week, per ekklesia</span>
      </div>

      {/* Row 1: Weekly comparison + Doughnut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Chart 1: Weekly Comparison */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-custom p-5 shadow-sm">
          <div className="mb-3">
            <div className="font-semibold text-slate-800 text-sm">Weekly Attendance Comparison</div>
            <div className="text-xs text-slate-400 mt-0.5">This week vs last week, per ekklesia</div>
          </div>

          {/* % change badges — grouped by kampo */}
          <div className="space-y-2 mb-4">
            {KAMPOS.map(k => {
              const ekks = ekklesiasForKampo(k.id)
              return (
                <div key={k.id}>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{k.name}</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {ekks.map(e => {
                      const idx    = EKKLESIAS.findIndex(x => x.id === e.id)
                      const curr   = stats.thisWeekByEkk[e.id] || 0
                      const prev   = stats.lastWeekByEkk[e.id] || 0
                      const change = pctChange(curr, prev)
                      return (
                        <div key={e.id} className="flex items-center gap-1">
                          <span className="inline-block w-2 h-2 rounded-full shrink-0"
                            style={{ background: EKKLESIA_COLORS[idx]?.solid || '#888' }} />
                          <span className="text-xs text-slate-600 font-medium">{e.name}</span>
                          {change === null ? (
                            <span className="text-xs text-slate-400">— no data</span>
                          ) : change.dir === 'up' ? (
                            <span className="text-xs font-bold text-emerald-600">↑ +{change.value}%</span>
                          ) : change.value === 0 ? (
                            <span className="text-xs font-bold text-slate-500">→ 0%</span>
                          ) : (
                            <span className="text-xs font-bold text-red-500">↓ −{change.value}%</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <Bar data={weeklyBarData} options={weeklyBarOptions} />
        </div>

        {/* Chart 2: Doughnut */}
        <div className="bg-white border border-slate-200 rounded-custom p-5 shadow-sm flex flex-col">
          <div className="mb-3">
            <div className="font-semibold text-slate-800 text-sm">Ekklesia Distribution</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Share of total attendance this week
              {totalThisWeek > 0 && (
                <span className="ml-1 font-semibold text-slate-600">({totalThisWeek} total)</span>
              )}
            </div>
          </div>

          {totalThisWeek === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm text-center py-8">
              No attendance recorded<br />this week yet.
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-[260px]">
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart 3: Daily Trend */}
      <div className="bg-white border border-slate-200 rounded-custom p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <div className="font-semibold text-slate-800 text-sm">Daily Attendance Trend</div>
            <div className="text-xs text-slate-400 mt-0.5">
              Attendance per day — current week (Mon → Sun)
            </div>
          </div>

          {/* Filter controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs text-slate-500 shrink-0">View:</label>

            {/* Scope toggle */}
            <div className="inline-flex rounded-lg border border-slate-200 overflow-hidden">
              {[['ekklesia', 'By Ekklesia'], ['kampo', 'By Kampo']].map(([val, label], i) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setFilterScope(val); setFilterType('all') }}
                  className={[
                    'px-2.5 py-1 text-xs font-semibold transition',
                    i > 0 ? 'border-l border-slate-200' : '',
                    filterScope === val ? 'bg-secondary text-white' : 'bg-white text-slate-600 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>

            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700
                         focus:outline-none focus:ring-2 focus:ring-secondary/30 cursor-pointer"
            >
              <option value="all">All</option>
              {filterScope === 'ekklesia'
                ? EKKLESIAS.map(e => <option key={e.id} value={e.id}>{e.name}</option>)
                : KAMPOS.map(k => <option key={k.id} value={k.id}>{k.name}</option>)
              }
            </select>
          </div>
        </div>

        <Line data={lineData} options={lineOptions} />
      </div>
    </div>
  )
}
