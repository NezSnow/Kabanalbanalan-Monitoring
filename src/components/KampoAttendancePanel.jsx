import { useEffect, useMemo, useState } from 'react'
import { KAMPOS } from '../constants/kampos'
import { fetchAttendanceByDateAllKampos } from '../lib/adminAttendanceService'

const JOIN_TYPES = ['Online', 'Face to Face', 'SVJ']

const JOIN_COLORS = {
  'Online':       { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  dot: 'bg-indigo-500'  },
  'Face to Face': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'SVJ':          { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
}

function normalizeKampoId(row) {
  if (row.kampo_id) return row.kampo_id
  const name  = (row.kampo || '').toLowerCase().trim()
  const found = KAMPOS.find(k => k.name.toLowerCase() === name || k.id === name)
  return found?.id ?? 'unknown'
}

function toISOToday() {
  return new Date().toISOString().slice(0, 10)
}

export default function KampoAttendancePanel() {
  const [date,    setDate]    = useState(toISOToday)
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchAttendanceByDateAllKampos(date)
      .then(data => { if (!cancelled) { setRows(data); setLoading(false) } })
      .catch(err  => { if (!cancelled) { setError(err.message); setLoading(false) } })

    return () => { cancelled = true }
  }, [date])

  // Build per-kampo aggregation
  const stats = useMemo(() => {
    const map = {}
    KAMPOS.forEach(k => {
      map[k.id] = { ...k, total: 0, Online: 0, 'Face to Face': 0, SVJ: 0 }
    })

    rows.forEach(row => {
      const kid = normalizeKampoId(row)
      if (!map[kid]) return
      map[kid].total++
      const jt = row.join_type || ''
      if (jt in map[kid]) map[kid][jt]++
    })

    return Object.values(map)
  }, [rows])

  const grandTotal   = rows.length
  const grandOnline  = rows.filter(r => r.join_type === 'Online').length
  const grandFTF     = rows.filter(r => r.join_type === 'Face to Face').length
  const grandSVJ     = rows.filter(r => r.join_type === 'SVJ').length

  return (
    <section className="bg-white border border-slate-200 rounded-custom p-4 sm:p-6 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <div className="font-bold text-slate-900">All-Kampo Attendance</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Total attendance breakdown by kampo and worship type
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 shrink-0">Worship date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Failed to load attendance: {error}
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-slate-500 text-sm">Loading attendance…</div>
      ) : grandTotal === 0 ? (
        <div className="py-10 text-center text-slate-500 text-sm">
          No attendance recorded for{' '}
          <span className="font-semibold">{new Date(date + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'long' })}</span>.
        </div>
      ) : (
        <>
          {/* Grand-total summary row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total',         value: grandTotal,  cls: 'text-slate-900' },
              { label: 'Online',        value: grandOnline, cls: 'text-indigo-600' },
              { label: 'Face to Face',  value: grandFTF,    cls: 'text-emerald-600' },
              { label: 'SVJ',           value: grandSVJ,    cls: 'text-amber-600' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="rounded-lg border border-slate-200 p-3 text-center">
                <div className={`text-2xl font-extrabold ${cls}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Per-kampo breakdown */}
          <div className="space-y-3">
            {stats.map(k => (
              <div key={k.id} className="rounded-lg border border-slate-200 p-4">
                {/* Kampo header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{k.name}</div>
                    {k.sub && <div className="text-xs text-slate-400">{k.sub}</div>}
                  </div>
                  <span className="inline-flex items-center justify-center h-7 min-w-[2rem] px-2 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                    {k.total}
                  </span>
                </div>

                {/* Progress bar (fill relative to grand total) */}
                {grandTotal > 0 && (
                  <div className="h-1.5 rounded-full bg-slate-100 mb-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${Math.round((k.total / grandTotal) * 100)}%` }}
                    />
                  </div>
                )}

                {/* Join-type chips */}
                <div className="flex flex-wrap gap-2">
                  {JOIN_TYPES.map(jt => {
                    const c   = JOIN_COLORS[jt]
                    const cnt = k[jt]
                    return (
                      <span
                        key={jt}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${c.bg} ${c.text} ${c.border}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                        {jt}: {cnt}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
