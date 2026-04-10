import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { getAuthStateByCredentials } from '../lib/accountService'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')
  const [pendingNotice, setPendingNotice] = useState('')
  const [kampo,    setKampo]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('role')
    const user = localStorage.getItem('user')
    if (role === 'admin') navigate('/admin-dashboard', { replace: true })
    else if (role === 'member' && user) navigate('/dashboard', { replace: true })

    const selected = localStorage.getItem('selectedKampo')
    if (!selected) {
      navigate('/', { replace: true, state: { message: 'Please select a kampo first' } })
      return
    }
    setKampo(selected)
  }, [navigate])

  useEffect(() => {
    if (location.state?.message) setSuccess(location.state.message)
  }, [location.state])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setPendingNotice('')
    const identifier = email.trim().toLowerCase()
    if (!identifier) {
      setError('Please enter your email')
      return
    }
    if (!password) {
      setError('Please enter your password')
      return
    }
    setSubmitting(true)
    try {
      const result = await getAuthStateByCredentials(identifier, password)
      if (result.state === 'pending') {
        setPendingNotice('Your account is under review or pending for approval.')
        setSubmitting(false)
        return
      }
      if (result.state !== 'approved' || !result.user) {
        setError('Invalid email or password')
        setSubmitting(false)
        return
      }
      localStorage.setItem('user', JSON.stringify(result.user))
      localStorage.setItem('role', 'member')
      setSubmitting(false)
      navigate('/dashboard')
    } catch (_err) {
      setSubmitting(false)
      setError('Unable to sign in right now. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-custom flex items-center justify-center text-white shadow-sm mb-3">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Welcome Back</h1>
          <div className="mt-1 inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {kampo}
          </div>
        </div>

        {/* Form card */}
        <form onSubmit={handleLogin} className="bg-white border border-slate-200 rounded-custom p-6 space-y-4 shadow-sm">
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
              {success}
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.25 0-9.27-3.11-11-7 1.06-2.39 2.86-4.37 5.12-5.56M9.88 9.88a3 3 0 104.24 4.24M6.1 6.1L3 3m18 18-3.1-3.1M6.1 6.1A11.97 11.97 0 0112 5c5.25 0 9.27 3.11 11 7a12.06 12.06 0 01-4.23 5.01" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-lg shadow-sm hover:brightness-105 active:scale-[0.98] transition disabled:opacity-60"
          >
            {submitting ? 'Logging in...' : 'Sign In'}
          </button>
          {pendingNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
              {pendingNotice}
            </div>
          )}
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          No account yet?{' '}
          <Link to="/signup" className="text-secondary font-semibold hover:underline">
            Sign Up
          </Link>
        </p>

        <p className="text-center mt-3">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-slate-400 hover:text-slate-600 hover:underline transition-colors"
          >
            ← Change Kampo
          </button>
        </p>
      </div>
    </div>
  )
}
