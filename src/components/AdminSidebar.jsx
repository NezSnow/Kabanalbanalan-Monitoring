const NAV = [
  {
    id: 'overview',
    label: 'Overview',
    sub: 'Stats & summary',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'users',
    label: 'Total Users',
    sub: 'View, edit & remove',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'analytics',
    label: 'Attendance Analytics',
    sub: 'Charts & trends',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3v18h18" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 14l2-2 3 3 5-7 3 3" />
      </svg>
    ),
  },
  {
    id: 'kampo',
    label: 'Kampo Attendance',
    sub: 'By date & kampo',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    id: 'accounts',
    label: 'Account Requests',
    sub: 'Approve / Reject',
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M8.5 11a4 4 0 100-8 4 4 0 000 8z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 8v6m3-3h-6" />
      </svg>
    ),
  },
]

export default function AdminSidebar({
  activeTab,
  sidebarOpen,
  sidebarCollapsed,
  pendingCount,
  newSignupCount,
  onNavTo,
  onToggleCollapse,
  onOverlayClick,
  onNotifications,
  onLogout,
}) {
  const sidebarWidthClass = sidebarCollapsed ? 'w-72 lg:w-20' : 'w-72'

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
          'shrink-0 border-r border-slate-200 bg-white flex flex-col',
          'fixed lg:sticky lg:top-0 lg:h-screen lg:self-start inset-y-0 left-0 z-30',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          'transition-[transform,width] duration-200 overflow-y-auto',
        ].join(' ')}
      >
        {/* ── Header ───────────────────────────────────────────────── */}
        <div className="p-4 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-secondary rounded-lg flex items-center justify-center text-white shadow-sm shrink-0">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>

            <button
              type="button"
              className={[
                'hidden lg:inline-flex p-1.5 rounded-lg border border-slate-200 bg-white shadow-sm',
                'hover:bg-slate-50 active:bg-slate-100 transition shrink-0',
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

            <div className={sidebarCollapsed ? 'min-w-0 lg:hidden' : 'min-w-0'}>
              <div className="font-bold text-slate-900 text-sm truncate leading-tight">Admin Panel</div>
              <div className="text-[10px] text-slate-500 truncate">Kabanalbanalan Monitoring</div>
            </div>
          </div>
        </div>

        {/* ── Navigation ───────────────────────────────────────────── */}
        <nav className="p-3 space-y-1.5 flex-1">
          {NAV.map(({ id, label, sub, icon }) => {
            const active = activeTab === id
            const isAccounts = id === 'accounts'
            const badgeCount = isAccounts ? pendingCount : 0

            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavTo(id)}
                className={[
                  'w-full py-2 rounded-lg border transition relative',
                  sidebarCollapsed ? 'px-3 lg:px-2' : 'px-3',
                  active
                    ? 'bg-secondary/10 border-secondary/30 text-slate-900'
                    : 'bg-white border-slate-200 hover:bg-slate-50',
                ].join(' ')}
              >
                <div className={sidebarCollapsed ? 'flex items-center gap-3 lg:justify-center lg:gap-0' : 'flex items-center gap-3'}>
                  <div className={[
                    'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border relative',
                    active
                      ? 'bg-secondary text-white border-secondary'
                      : 'bg-secondary/10 text-secondary border-secondary/20',
                  ].join(' ')}>
                    {icon}
                    {sidebarCollapsed && badgeCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[1rem] h-4 px-1 rounded-full bg-secondary text-white text-[9px] font-bold flex items-center justify-center leading-none">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </div>
                  <div className={sidebarCollapsed ? 'min-w-0 text-left lg:hidden flex-1' : 'min-w-0 text-left flex-1'}>
                    <div className="font-semibold text-sm flex items-center justify-between gap-1">
                      <span>{label}</span>
                      {badgeCount > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[1.1rem] h-5 px-1.5 rounded-full bg-secondary text-white text-[10px] font-bold">
                          {badgeCount > 99 ? '99+' : badgeCount}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{sub}</div>
                  </div>
                </div>
              </button>
            )
          })}

          {/* Notifications button */}
          <button
            type="button"
            onClick={onNotifications}
            className={[
              'w-full py-2 rounded-lg border transition relative',
              sidebarCollapsed ? 'px-3 lg:px-2' : 'px-3',
              'bg-white border-slate-200 hover:bg-slate-50',
            ].join(' ')}
          >
            <div className={sidebarCollapsed ? 'flex items-center gap-3 lg:justify-center lg:gap-0' : 'flex items-center gap-3'}>
              <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border bg-amber-50 text-amber-600 border-amber-200 relative">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M15 17h5l-1.4-1.4A2 2 0 0118 14.17V11a6 6 0 10-12 0v3.17c0 .53-.21 1.04-.59 1.42L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
                </svg>
                {newSignupCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[1rem] h-4 px-1 rounded-full bg-secondary text-white text-[9px] font-bold flex items-center justify-center leading-none animate-bounce">
                    {newSignupCount > 99 ? '99+' : newSignupCount}
                  </span>
                )}
              </div>
              <div className={sidebarCollapsed ? 'min-w-0 text-left lg:hidden flex-1' : 'min-w-0 text-left flex-1'}>
                <div className="font-semibold text-sm flex items-center justify-between gap-1">
                  <span>Notifications</span>
                  {newSignupCount > 0 && (
                    <span className="inline-flex items-center justify-center min-w-[1.1rem] h-5 px-1.5 rounded-full bg-secondary text-white text-[10px] font-bold animate-bounce">
                      {newSignupCount > 99 ? '99+' : newSignupCount}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">Realtime alerts</div>
              </div>
            </div>
          </button>
        </nav>

        {/* ── Logout ───────────────────────────────────────────────── */}
        <div className="px-3 pb-3 shrink-0">
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
      </aside>
    </>
  )
}
