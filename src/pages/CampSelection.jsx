import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { KAMPOS } from '../constants/kampos'

export default function CampSelection() {
  const navigate = useNavigate()
  const location = useLocation()
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (location.state?.message) {
      setNotice(location.state.message)
    }
  }, [location.state])

  useEffect(() => {
    const role = localStorage.getItem('role')
    const user = localStorage.getItem('user')
    if (role === 'admin') {
      navigate('/admin-dashboard', { replace: true })
    } else if (role === 'member' && user) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  function selectKampo(kampo) {
    localStorage.setItem('selectedKampoId', kampo.id)
    localStorage.setItem('selectedKampo', kampo.name)
    localStorage.setItem('kampo_id', kampo.id)
    navigate('/login')
  }

  function goAdmin() {
    navigate('/admin-login')
  }

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-custom flex items-center justify-center text-white shadow-sm shrink-0">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <div className="font-bold text-slate-900 leading-tight">Grace Community</div>
            <div className="text-xs text-slate-500">Kabanalbanalan Monitoring</div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-3xl">
          {notice && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm text-center">
              {notice}
            </div>
          )}
          {/* Hero */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/20 rounded-custom mb-4">
              <svg className="h-7 w-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Select Your Kampo</h1>
            <p className="mt-2 text-slate-500 text-sm sm:text-base">
              Choose your group to continue to attendance check-in
            </p>
          </div>

          {/* Kampo grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {KAMPOS.map(k => (
              <button
                key={k.id}
                type="button"
                onClick={() => selectKampo(k)}
                className="group flex flex-col items-center justify-center gap-2 p-5 bg-white border-2 border-slate-200 rounded-custom hover:border-primary hover:bg-primary/5 active:scale-[0.97] transition-all duration-150 shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-colors">
                  <svg className="h-5 w-5 text-primary group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-slate-900 leading-tight">{k.name}</div>
                  {k.sub && <div className="text-xs text-slate-500 mt-0.5">{k.sub}</div>}
                </div>
              </button>
            ))}
          </div>

          {/* Admin link */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={goAdmin}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-secondary hover:underline transition-colors"
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
