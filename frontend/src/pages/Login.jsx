// ─── What this file does ──────────────────────────────────────────────────────
// The login/signup page — the first thing a new user sees.
//
// One form, two modes (Sign In / Sign Up), toggled by a tab at the top.
// On signup: picks a role (Creator or Business), enters name + email + password.
// On login: just email + password.
//
// After success:
//   Business → goes straight to /business dashboard
//   New artist → goes to /setup to build their profile
//   Returning artist → checks if profile exists → /artist or /setup
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode]       = useState('login')
  const [role, setRole]       = useState('artist')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  // Already logged in — redirect away
  if (user) return <Navigate to={user.role === 'business' ? '/business' : '/artist'} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const url  = mode === 'login' ? '/api/auth/login' : '/api/auth/signup'
      const body = mode === 'login'
        ? { email, password }
        : { email, password, role, display_name: name }

      const res  = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Something went wrong.'); return }

      login({
        user_id:      data.user_id,
        email:        data.email,
        role:         data.role,
        display_name: data.display_name || name || email.split('@')[0],
        access_token: data.access_token,
      })

      if (data.role === 'business') {
        navigate('/business', { replace: true })
      } else if (mode === 'signup') {
        navigate('/setup', { replace: true })
      } else {
        // Returning artist — check if profile is complete
        try {
          const profileRes = await fetch('/api/profiles/me', {
            headers: { Authorization: `Bearer ${data.access_token}` },
          })
          const profile = profileRes.ok ? await profileRes.json() : null
          navigate(profile?.bio ? '/artist' : '/setup', { replace: true })
        } catch {
          navigate('/artist', { replace: true })
        }
      }
    } catch {
      setError('Could not reach the server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row">
      {/* Hero - Left Side */}
      <div className="lg:w-1/2 bg-green-900 p-10 lg:p-20 flex flex-col justify-center items-center lg:items-start text-center lg:text-left">
        <span className="inline-block bg-green-700 text-green-200 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6 animate-fade-up">
          Philadelphia's Creator Marketplace
        </span>
        <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight animate-fade-up">
          Good<br />
          <span className="text-green-400">Neighbors.</span>
        </h1>
        <p className="text-green-200 mt-4 text-base max-w-md animate-fade-up">
          Connecting Philly creators with local businesses — matched by vibe, not keywords.
        </p>
        <div className="flex flex-wrap justify-center lg:justify-start gap-3 mt-8 animate-fade-up">
          {['🎵 Live Music', '🎨 Visual Art', '📸 Food Influencer', '🎬 Video & Film', '🖌️ Muralists'].map(tag => (
            <span key={tag} className="bg-green-800 text-green-200 text-xs px-3 py-1.5 rounded-full">{tag}</span>
          ))}
        </div>
      </div>

      {/* Form - Right Side */}
      <div className="lg:w-1/2 bg-gray-50 dark:bg-gray-950 p-6 flex justify-center items-center">
        <div className="w-full max-w-sm">
          <div className="card p-7 animate-scale-in shadow-xl">

            {/* Mode toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6">
              {[{ id: 'login', label: 'Sign In' }, { id: 'signup', label: 'Sign Up' }].map(m => (
                <button
                  key={m.id}
                  onClick={() => { setMode(m.id); setError('') }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                    mode === m.id
                      ? 'bg-green-700 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                  }`}
                >{m.label}</button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role picker — signup only */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">I am a...</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ value: 'artist', label: 'Creator', emoji: '🎨' }, { value: 'business', label: 'Business', emoji: '🏢' }].map(r => (
                      <button
                        key={r.value} type="button" onClick={() => setRole(r.value)}
                        className={`py-3 rounded-xl border-2 text-sm font-bold transition-all duration-200 ${
                          role === r.value
                            ? 'border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-green-300'
                        }`}
                      >
                        <div className="text-xl mb-0.5">{r.emoji}</div>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Name — signup only */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {role === 'business' ? 'Business Name' : 'Your Name'}
                  </label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)}
                    placeholder={role === 'business' ? 'e.g. Hello Vietnam' : 'e.g. Joshua Mitchell'}
                    className="field" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" className="field" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" className="field" minLength={6} />
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="btn bg-green-600 hover:bg-green-700 text-white w-full py-3 rounded-xl mt-1 disabled:opacity-60 text-sm">
                {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-gray-400 mt-5">
              {mode === 'login' ? 'New here? ' : 'Already have an account? '}
              <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
                className="text-green-600 font-bold hover:underline">
                {mode === 'login' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
