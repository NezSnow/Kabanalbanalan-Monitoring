import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { KAMPOS, EKKLESIAS, ekklesiasForKampo, parentKampoId, parentKampoName } from '../constants/kampos'

export default function CampSelection() {
  const navigate = useNavigate()
  const location = useLocation()
  const [notice, setNotice] = useState('')
  const [selectedKampo, setSelectedKampo] = useState(null) // step 2 state

  useEffect(() => {
    if (location.state?.message) setNotice(location.state.message)
  }, [location.state])

  useEffect(() => {
    const role = localStorage.getItem('role')
    const user = localStorage.getItem('user')
    if (role === 'admin') navigate('/admin-dashboard', { replace: true })
    else if (role === 'member' && user) navigate('/dashboard', { replace: true })
  }, [navigate])

  function handleKampoClick(kampo) {
    setSelectedKampo(kampo)
    setNotice('')
  }

  function handleEkklesiaClick(ekklesia) {
    localStorage.setItem('selectedKampoId',     ekklesia.id)
    localStorage.setItem('selectedKampo',        ekklesia.name)
    localStorage.setItem('kampo_id',             ekklesia.id)
    localStorage.setItem('parentKampoId',        ekklesia.kampoId)
    localStorage.setItem('parentKampo',          parentKampoName(ekklesia.id))
    navigate('/login')
  }

  function handleBack() {
    setSelectedKampo(null)
  }

  const ekklesiasToShow = selectedKampo ? ekklesiasForKampo(selectedKampo.id) : []

  return (
    <div className="min-h-screen camp-bg font-sans antialiased flex flex-col relative overflow-hidden">

      {/* ── Floating orbs ─────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="camp-orb-1 absolute -top-24 -left-24 w-96 h-96 rounded-full bg-yellow-300/25 blur-3xl" />
        <div className="camp-orb-2 absolute top-1/2 -right-32 w-80 h-80 rounded-full bg-red-800/30 blur-3xl" />
        <div className="camp-orb-3 absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="absolute inset-0 bg-black/50" />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl flex items-center justify-center shadow-lg shrink-0">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <div className="text-base font-extrabold text-white leading-tight drop-shadow tracking-wide">Most Holy Church</div>
            <div className="text-[11px] font-medium text-white/80 tracking-wider uppercase">Kabanalbanalan Monitoring</div>
          </div>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl">

          {notice && (
            <div className="mb-6 p-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white text-sm text-center shadow">
              {notice}
            </div>
          )}

          {/* ── STEP 1: Select Kampo ──────────────────────────────── */}
          {!selectedKampo && (
            <>
              <div className="text-center mb-10 camp-fade-up">
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-5">
                  <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 animate-pulse" />
                  <div className="absolute inset-2 rounded-full bg-white/10 border border-white/20" />
                  <svg className="relative h-9 w-9 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-white drop-shadow-lg tracking-tight leading-none">
                  Select Your Kampo
                </h1>
                <p className="mt-2 text-white/90 text-sm sm:text-base font-medium tracking-wide">
                  Choose your province / district to continue
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                {KAMPOS.map((k, i) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => handleKampoClick(k)}
                    className={[
                      'group camp-fade-up',
                      i === 0 ? 'camp-fade-up-d1' : i === 1 ? 'camp-fade-up-d2' : 'camp-fade-up-d3',
                      'flex flex-col items-center justify-center gap-2.5 p-6',
                      'bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl shadow-lg',
                      'hover:bg-white/30 hover:border-white/50 hover:scale-[1.04]',
                      'active:scale-[0.97] transition-all duration-200',
                    ].join(' ')}
                  >
                    <div className="w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center group-hover:bg-white/40 transition-colors shadow-inner">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-extrabold text-white leading-tight drop-shadow tracking-tight group-hover:text-yellow-200 transition-colors">
                        {k.name}
                      </div>
                      <div className="text-[11px] font-medium text-white/70 mt-1 tracking-wide">
                        {EKKLESIAS.filter(e => e.kampoId === k.id).length} ekklesia{EKKLESIAS.filter(e => e.kampoId === k.id).length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <svg className="h-4 w-4 text-white/60 group-hover:text-white/90 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── STEP 2: Select Ekklesia ───────────────────────────── */}
          {selectedKampo && (
            <>
              <div className="text-center mb-8 camp-fade-up">
                {/* Back button */}
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/70 hover:text-white mb-5 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Kampo selection
                </button>

                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-5">
                  <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 animate-pulse" />
                  <div className="absolute inset-2 rounded-full bg-white/10 border border-white/20" />
                  <svg className="relative h-9 w-9 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white/80 text-xs font-semibold mb-3 tracking-wide">
                  {selectedKampo.name}
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white drop-shadow-lg tracking-tight leading-none">
                  Select Your Ekklesia
                </h1>
                <p className="mt-2 text-white/90 text-sm sm:text-base font-medium tracking-wide">
                  Choose your congregation to proceed to login
                </p>
              </div>

              <div className={[
                'grid gap-3 mb-8',
                ekklesiasToShow.length <= 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-md mx-auto' : 'grid-cols-1 sm:grid-cols-3',
              ].join(' ')}>
                {ekklesiasToShow.map((e, i) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => handleEkklesiaClick(e)}
                    className={[
                      'group camp-fade-up',
                      i === 0 ? 'camp-fade-up-d1' : i === 1 ? 'camp-fade-up-d2' : 'camp-fade-up-d3',
                      'flex flex-col items-center justify-center gap-2.5 p-6',
                      'bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl shadow-lg',
                      'hover:bg-white/30 hover:border-white/50 hover:scale-[1.04]',
                      'active:scale-[0.97] transition-all duration-200',
                    ].join(' ')}
                  >
                    <div className="w-12 h-12 rounded-full bg-white/20 border border-white/30 flex items-center justify-center group-hover:bg-white/40 transition-colors shadow-inner">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-extrabold text-white leading-tight drop-shadow tracking-tight group-hover:text-yellow-200 transition-colors">
                        {e.name}
                      </div>
                    </div>
                    <svg className="h-4 w-4 text-white/60 group-hover:text-white/90 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Admin link */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => navigate('/admin-login')}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-white/70 hover:text-white hover:underline transition-colors"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin Access
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
