import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminLogin() {
  const navigate  = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('role') === 'admin') {
      navigate('/admin-dashboard', { replace: true })
    }
  }, [navigate])

  function handleLogin(e) {
    e.preventDefault()
    setError('')
    const usernameInput = username.trim()
    if (!usernameInput) {
      setError('Please enter your email')
      return
    }
    if (!password) {
      setError('Please enter your password')
      return
    }
    setSubmitting(true)
    if (usernameInput.toLowerCase() !== 'admin') {
      setError('Unauthorized access')
      setSubmitting(false)
      return
    }
    if (usernameInput === 'admin' && password === 'admin123') {
      localStorage.setItem('role', 'admin')
      setSubmitting(false)
      navigate('/admin-dashboard')
    } else {
      setError('Invalid email or password')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-secondary rounded-custom flex items-center justify-center text-white shadow-sm mb-3">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Admin Access</h1>
          <p className="text-sm text-slate-500 mt-1">Kabanalbanalan Monitoring System</p>
        </div>

        {/* Form card */}
        <form onSubmit={handleLogin} className="bg-white border border-slate-200 rounded-custom p-6 space-y-4 shadow-sm">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/40"
              required
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
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary/40"
                required
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
            className="w-full py-2.5 bg-secondary text-white font-bold rounded-lg shadow-sm hover:brightness-105 active:scale-[0.98] transition disabled:opacity-60"
          >
            {submitting ? 'Logging in...' : 'Sign In as Admin'}
          </button>
        </form>

        <p className="text-center mt-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-xs text-slate-400 hover:text-slate-600 hover:underline transition-colors"
          >
            ← Back to Camp Selection
          </button>
        </p>
      </div>
    </div>
  )
}
