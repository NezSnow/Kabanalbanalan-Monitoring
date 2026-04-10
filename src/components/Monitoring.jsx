import { useMemo, useState } from 'react'
import { toISODate, initialsShortName, spiritualDisplayName, avatarUrl } from '../utils/helpers'

export default function Monitoring({ attendance }) {
  const [monitorDate, setMonitorDate] = useState(() => toISODate(new Date()))
  const [monitorView, setMonitorView] = useState('cards') // 'cards' | 'names'

  const records = useMemo(
    () => attendance.filter(r => r.dateISO === monitorDate),
    [attendance, monitorDate]
  )

  const totals = useMemo(() => ({
    overall:  records.length,
    ftf:      records.filter(r => r.joinType === 'Face to Face').length,
    online:   records.filter(r => r.joinType === 'Online').length,
    svj:      records.filter(r => r.joinType === 'SVJ').length,
    visitors: records.filter(r => r.isVisitor).length,
  }), [records])

  return (
    <main className="px-3 sm:px-6 py-4 sm:py-6">
      <div className="max-w-5xl mx-auto space-y-4">

        {/* ── Filters & totals ── */}
        <section className="bg-white border border-slate-200 rounded-custom p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
            <div>
              <div className="text-lg font-bold">Attendance Monitoring</div>
              <div className="text-sm text-slate-500">
                Pick a worship date to view totals and attendees.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
              {/* Date picker */}
              <div>
                <label className="block text-xs text-slate-500 mb-1">Worship date</label>
                <input
                  type="date"
                  value={monitorDate}
                  onChange={e => setMonitorDate(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              {/* View toggle */}
              <div className="flex flex-col gap-1">
                <span className="block text-xs text-slate-500 mb-1">View</span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => setMonitorView('cards')}
                    className={[
                      'flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm',
                      monitorView === 'cards'
                        ? 'bg-primary text-white'
                        : 'text-slate-600 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="4" y="4" width="7" height="7" rx="1" />
                      <rect x="13" y="4" width="7" height="7" rx="1" />
                      <rect x="4" y="13" width="7" height="7" rx="1" />
                      <rect x="13" y="13" width="7" height="7" rx="1" />
                    </svg>
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonitorView('names')}
                    className={[
                      'flex items-center gap-1 px-3 py-1.5 text-xs sm:text-sm border-l border-slate-200',
                      monitorView === 'names'
                        ? 'bg-primary text-white'
                        : 'text-slate-600 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                        d="M4 7h16M4 12h10M4 17h7" />
                    </svg>
                    <span className="hidden sm:inline">Names</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Overall total',  value: totals.overall },
              { label: 'Total FTF',      value: totals.ftf },
              { label: 'Total Online',   value: totals.online },
              { label: 'Total SVJ',      value: totals.svj },
              { label: 'Total Visitors', value: totals.visitors },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg border border-slate-200 p-3">
                <div className="text-xs text-slate-500">{label}</div>
                <div className="text-2xl font-extrabold">{value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Attendees ── */}
        <section className="bg-white border border-slate-200 rounded-custom p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="font-bold">Attendees</div>
            <div className="text-xs text-slate-500">{records.length} record(s)</div>
          </div>

          {monitorView === 'names' ? (
            <div className="space-y-2">
              {records.map(r => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 border border-slate-100 rounded-lg px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold truncate">
                      {spiritualDisplayName({ name: r.memberName, gender: r.gender })}
                      {r.isVisitor && (
                        <span className="ml-2 text-xs text-secondary font-semibold">(Visitor)</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{r.joinType}</div>
                  </div>
                  <div className="text-xs text-slate-400 shrink-0">
                    {new Date(r.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              {!records.length && (
                <div className="py-10 text-center text-slate-500 text-sm">
                  No attendance recorded for this date.
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {records.map(r => (
                <div
                  key={r.id}
                  className="border border-slate-200 rounded-custom p-3 text-center"
                >
                  <img
                    className="w-14 h-14 rounded-full object-cover mx-auto mb-2 border border-slate-200"
                    src={r.img || avatarUrl(r.memberId)}
                    alt={r.memberName}
                  />
                  <div className="text-xs font-semibold truncate">
                    {r.memberShort || initialsShortName(r.memberName)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {r.joinType}{r.isVisitor ? ' • Visitor' : ''}
                  </div>
                </div>
              ))}
              {!records.length && (
                <div className="col-span-full py-10 text-center text-slate-500 text-sm">
                  No attendance recorded for this date.
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
