import { formatHeaderTime } from '../utils/helpers'

const NAV = [
  {
    id: 'attendance',
    label: 'Attendance',
    sub: 'Kiosk check-in',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 11l3 3L22 4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
      </svg>
    ),
  },
  {
    id: 'manage',
    label: 'Manage Kapatid',
    sub: 'Add / Edit / Remove',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 3l4 4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-6 6" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 9l-1 1" />
      </svg>
    ),
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    sub: 'Totals & breakdown',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3v18h18" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 14l2-2 3 3 5-7 3 3" />
      </svg>
    ),
  },
]

export default function Sidebar({
  activeTab,
  sidebarOpen,
  sidebarCollapsed,
  sidebarWidthClass,
  now,
  onNavTo,
  onToggleCollapse,
  onOverlayClick,
  onLogout,
}) {
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={onOverlayClick}
        />
      )}

      <aside
        className={[
          sidebarWidthClass,
          'shrink-0 border-r border-slate-200 bg-white',
          'fixed lg:sticky lg:top-0 lg:h-screen lg:self-start inset-y-0 left-0 z-30',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'transition-transform duration-200 overflow-y-auto',
        ].join(' ')}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-start justify-between gap-2">
            <div className={sidebarCollapsed ? 'flex items-center gap-2 lg:gap-0' : 'flex items-center gap-2'}>
              {/* Logo icon */}
              <div className="w-6 h-6 bg-primary rounded-[6px] flex items-center justify-center text-white shadow-sm shrink-0">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>

              {/* Desktop collapse toggle */}
              <button
                type="button"
                className={[
                  'hidden lg:inline-flex p-1.5 rounded-lg border border-slate-200 bg-white shadow-sm',
                  'hover:bg-slate-50 active:bg-slate-100 transition',
                  sidebarCollapsed ? 'lg:ml-1' : '',
                ].join(' ')}
                onClick={onToggleCollapse}
                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {sidebarCollapsed ? (
                  <svg className="h-4 w-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                )}
              </button>

              {/* Brand name — hidden when collapsed on desktop */}
              <div className={sidebarCollapsed ? 'min-w-0 lg:hidden' : 'min-w-0'}>
                <div className="font-bold truncate">Grace Community</div>
                <div className="text-xs text-slate-500 truncate">Kabanalbanalan Monitoring</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Navigation ─────────────────────────────────────────── */}
        <nav className="p-3 space-y-2">
          {NAV.map(({ id, label, sub, icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavTo(id)}
                className={[
                  'w-full py-2 rounded-lg border transition',
                  sidebarCollapsed ? 'px-3 lg:px-2' : 'px-3',
                  active
                    ? 'bg-primary/10 border-primary/30 text-slate-900'
                    : 'bg-white border-slate-200 hover:bg-slate-50',
                ].join(' ')}
              >
                <div className={sidebarCollapsed ? 'flex items-center gap-3 lg:justify-center lg:gap-0' : 'flex items-center gap-3'}>
                  <div className={[
                    'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border',
                    active
                      ? 'bg-primary text-white border-primary'
                      : 'bg-primary/10 text-primary border-primary/20',
                  ].join(' ')}>
                    {icon}
                  </div>
                  <div className={sidebarCollapsed ? 'min-w-0 text-left lg:hidden' : 'min-w-0 text-left'}>
                    <div className="font-semibold">{label}</div>
                    <div className="text-xs text-slate-500">{sub}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </nav>

        {/* ── Logout ─────────────────────────────────────────────── */}
        {onLogout && (
          <div className="px-3 pb-2">
            <button
              type="button"
              onClick={onLogout}
              className={[
                'w-full py-2 rounded-lg border transition',
                sidebarCollapsed ? 'px-3 lg:px-2' : 'px-3',
                'bg-white border-secondary/20 text-secondary hover:bg-secondary/5',
              ].join(' ')}
            >
              <div className={sidebarCollapsed ? 'flex items-center gap-3 lg:justify-center lg:gap-0' : 'flex items-center gap-3'}>
                <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border bg-secondary/10 text-secondary border-secondary/20">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
                <div className={sidebarCollapsed ? 'min-w-0 lg:hidden' : 'min-w-0'}>
                  <div className="font-semibold text-sm">Logout</div>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* ── Footer clock ───────────────────────────────────────── */}
        {sidebarCollapsed ? (
          <>
            <div className="p-3 border-t border-slate-200 text-xs text-slate-500 lg:hidden">
              <div className="flex items-center justify-between">
                <span>Now</span>
                <span className="font-medium text-slate-700">{formatHeaderTime(now)}</span>
              </div>
            </div>
            <div className="p-3 border-t border-slate-200 text-xs text-slate-500 items-center justify-center hidden lg:flex">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
          </>
        ) : (
          <div className="p-3 border-t border-slate-200 text-xs text-slate-500">
            <div className="flex items-center justify-between">
              <span>Now</span>
              <span className="font-medium text-slate-700">{formatHeaderTime(now)}</span>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
