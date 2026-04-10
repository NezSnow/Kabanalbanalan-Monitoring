import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { KAMPO_BY_NAME } from '../constants/kampos'
import { createPendingUser } from '../lib/accountService'

export default function Signup() {
  const navigate = useNavigate()
  const [form,  setForm]  = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [kampo, setKampo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const selected = localStorage.getItem('selectedKampo')
    if (!selected) {
      navigate('/', { replace: true, state: { message: 'Please select a kampo first' } })
      return
    }
    setKampo(selected)
  }, [navigate])

  function update(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSignup(e) {
    e.preventDefault()
    setError('')
    const name = form.name.trim()
    const email = form.email.trim()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!name || !email || !form.password || !form.confirm) {
      setError('All fields are required')
      return
    }
    if (!emailRegex.test(email)) {
      setError('Email is invalid')
      return
    }
    setSubmitting(true)

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      setSubmitting(false)
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      setSubmitting(false)
      return
    }

    try {
      await createPendingUser({
        name,
        email,
        password: form.password,
        kampo,
        kampo_id: KAMPO_BY_NAME[kampo.toLowerCase()]?.id || '',
      })
      setSubmitting(false)
      navigate('/login', { state: { message: 'Account created successfully' } })
    } catch (err) {
      const msg = String(err?.message || '').toLowerCase()
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('app_users_email_key')) {
        setError('An account with this email already exists.')
      } else {
        setError('Unable to submit signup request. Please try again.')
      }
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-custom flex items-center justify-center text-white shadow-sm mb-3">
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Create Account</h1>
          {kampo && (
            <div className="mt-1 inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {kampo}
            </div>
          )}
        </div>

        {/* Form card */}
        <form onSubmit={handleSignup} className="bg-white border border-slate-200 rounded-custom p-6 space-y-4 shadow-sm">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              placeholder="e.g. Juan dela Cruz"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => update('email', e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => update('password', e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
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

          <div>
            <label className="block text-sm font-semibold mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirm}
                onChange={e => update('confirm', e.target.value)}
                placeholder="Repeat your password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(v => !v)}
                className="absolute inset-y-0 right-0 px-3 text-slate-500 hover:text-slate-700"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
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

          {kampo && (
            <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500">
              <svg className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Your account will be linked to <span className="font-semibold text-slate-700">{kampo}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-primary text-white font-bold rounded-lg shadow-sm hover:brightness-105 active:scale-[0.98] transition disabled:opacity-60"
          >
            {submitting ? 'Creating account...' : 'Submit for Approval'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-3">
          New accounts require admin approval before sign in.
        </p>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-secondary font-semibold hover:underline">
            Sign In
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
