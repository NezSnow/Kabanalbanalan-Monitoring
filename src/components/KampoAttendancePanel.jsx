import { useEffect, useMemo, useState } from 'react'
import { EKKLESIAS, KAMPOS, ekklesiasForKampo } from '../constants/kampos'
import { fetchAttendanceByDateAllKampos, fetchMemberCountsAllKampos, normalizeEkklesiaId } from '../lib/adminAttendanceService'

const JOIN_TYPES = ['Online', 'Face to Face', 'SVJ']

const JOIN_COLORS = {
  'Online':       { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  dot: 'bg-indigo-500'  },
  'Face to Face': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'SVJ':          { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500'   },
}

function toISOToday() { return new Date().toISOString().slice(0, 10) }

export default function KampoAttendancePanel() {
  const [date,    setDate]    = useState(toISOToday)
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [trm,     setTrm]     = useState({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchAttendanceByDateAllKampos(date)
      .then(data => { if (!cancelled) { setRows(data); setLoading(false) } })
      .catch(err  => { if (!cancelled) { setError(err.message); setLoading(false) } })

    return () => { cancelled = true }
  }, [date])

  useEffect(() => {
    fetchMemberCountsAllKampos()
      .then(counts => setTrm(counts))
      .catch(() => {})
  }, [])

  // Build per-ekklesia aggregation
  const ekkStats = useMemo(() => {
    const map = {}
    EKKLESIAS.forEach(e => {
      map[e.id] = { ...e, total: 0, Online: 0, 'Face to Face': 0, SVJ: 0 }
    })

    rows.forEach(row => {
      const eid = normalizeEkklesiaId(row)
      if (!eid || !map[eid]) return
      map[eid].total++
      const jt = row.join_type || ''
      if (jt in map[eid]) map[eid][jt]++
    })

    return map
  }, [rows])

  const grandTotal  = rows.length
  const grandOnline = rows.filter(r => r.join_type === 'Online').length
  const grandFTF    = rows.filter(r => r.join_type === 'Face to Face').length
  const grandSVJ    = rows.filter(r => r.join_type === 'SVJ').length
  const grandTRM    = EKKLESIAS.reduce((sum, e) => sum + (trm[e.id] || 0), 0)

  return (
    <section className="bg-white border border-slate-200 rounded-custom p-4 sm:p-6 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div>
          <div className="font-bold text-slate-900">Ekklesia Attendance</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Total attendance breakdown by ekklesia and worship type
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
          <span className="font-semibold">
            {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'long' })}
          </span>.
        </div>
      ) : (
        <>
          {/* Grand-total summary */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Total Attended', value: grandTotal,  cls: 'text-slate-900' },
              { label: 'Online',         value: grandOnline, cls: 'text-indigo-600' },
              { label: 'Face to Face',   value: grandFTF,    cls: 'text-emerald-600' },
              { label: 'SVJ',            value: grandSVJ,    cls: 'text-amber-600' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="rounded-lg border border-slate-200 p-3 text-center">
                <div className={`text-2xl font-extrabold ${cls}`}>{value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
            <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-center">
              <div className="text-2xl font-extrabold text-violet-700">{grandTRM || '—'}</div>
              <div className="text-xs text-violet-600 font-semibold mt-0.5">TRM (All Ekklesias)</div>
            </div>
          </div>

          {/* Per-kampo section → per-ekklesia rows */}
          <div className="space-y-5">
            {KAMPOS.map(kampo => {
              const ekks      = ekklesiasForKampo(kampo.id)
              const kampoTotal = ekks.reduce((sum, e) => sum + (ekkStats[e.id]?.total || 0), 0)
              const kampoTRM   = ekks.reduce((sum, e) => sum + (trm[e.id] || 0), 0)

              return (
                <div key={kampo.id} className="rounded-xl border border-slate-200 overflow-hidden">
                  {/* Kampo header bar */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {kampo.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-violet-50 text-violet-700 font-bold border border-violet-200">
                        TRM: {kampoTRM}
                      </span>
                      <span className="inline-flex items-center justify-center h-6 min-w-[2rem] px-2 rounded-full bg-slate-200 text-slate-700 font-bold border border-slate-300">
                        {kampoTotal} attended
                      </span>
                    </div>
                  </div>

                  {/* Ekklesia rows */}
                  <div className="divide-y divide-slate-100">
                    {ekks.map(e => {
                      const stat     = ekkStats[e.id]
                      const ekkTRM   = trm[e.id] || 0
                      const rate     = ekkTRM > 0 ? Math.round((stat.total / ekkTRM) * 100) : null

                      return (
                        <div key={e.id} className="px-4 py-3">
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <div className="font-semibold text-slate-800 text-sm">{e.name}</div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-violet-50 text-violet-700 text-xs font-bold border border-violet-200">
                                TRM: {ekkTRM}
                              </span>
                              <span className="inline-flex items-center justify-center h-6 min-w-[2rem] px-2 rounded-full bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200">
                                {stat.total}
                              </span>
                            </div>
                          </div>

                          {/* Attendance rate bar */}
                          {rate !== null && (
                            <div className="mb-2">
                              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                                <span>Attendance rate</span>
                                <span className={`font-bold ${rate >= 75 ? 'text-emerald-600' : rate >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
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

                          {/* Join-type chips */}
                          <div className="flex flex-wrap gap-2">
                            {JOIN_TYPES.map(jt => {
                              const c   = JOIN_COLORS[jt]
                              const cnt = stat[jt]
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
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
