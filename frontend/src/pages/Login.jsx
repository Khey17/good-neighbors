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

import { useState, useEffect } from 'react'
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
  const [animStep, setAnimStep] = useState(-1)

  useEffect(() => {
    const timers = [
      setTimeout(() => setAnimStep(0), 50),    // Step 0: Fade in securely
      setTimeout(() => setAnimStep(1), 1500),  // Step 1: Smoothly expand into "Good Neighbors"
      setTimeout(() => setAnimStep(2), 3100),  // Step 2: Split and move to layout
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

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
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col lg:flex-row bg-green-900 dark:bg-gray-950 transition-colors duration-300">
      {/* Hero - Left Side */}
      <div className="lg:w-1/2 p-10 lg:p-20 flex flex-col justify-center items-center lg:items-start text-center lg:text-left">
        
        <div className={`grid transition-all duration-1000 ease-in-out ${animStep >= 2 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="mb-8">
              <span className="inline-block bg-green-700 dark:bg-gray-800 text-green-200 dark:text-gray-300 text-sm font-bold uppercase tracking-widest px-4 py-2 rounded-full">
                Philadelphia's Creator Marketplace
              </span>
            </div>
          </div>
        </div>
        
        <h1 className={`relative w-max mx-auto lg:mx-0 text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.1] origin-center transition-all duration-1000 ease-in-out ${
          animStep <= 0 ? 'translate-x-[20vw] -translate-y-8 lg:translate-x-[27vw] lg:-translate-y-16 scale-[3] lg:scale-[4]' :
          animStep === 1 ? 'translate-x-[12vw] -translate-y-4 lg:translate-x-[20vw] lg:-translate-y-8 scale-[1.25] lg:scale-[1.5]' :
          'translate-x-0 translate-y-0 scale-100'
        } ${animStep === -1 ? 'opacity-0 blur-sm' : 'opacity-100 blur-0'}`}>
          
          {/* Invisible placeholder to maintain the box size so layout doesn't jump */}
          <div className="opacity-0 pointer-events-none select-none flex flex-col" aria-hidden="true">
            <span>Good</span>
            <span>Neighbors</span>
          </div>

          <div className={`absolute top-0 left-0 flex items-center text-white transition-all duration-1000 ease-in-out ${
            animStep <= 0 ? 'translate-x-[2.1em] translate-y-[0.55em]' : 
            animStep === 1 ? 'translate-x-[0em] translate-y-[0.55em]' : 
            'translate-x-0 translate-y-0'
          }`}>
            <span>G</span>
            <span className={`overflow-hidden transition-all duration-1000 ease-in-out ${animStep >= 1 ? 'max-w-[4em] opacity-100' : 'max-w-0 opacity-0'}`}>
              ood
            </span>
          </div>
        <div className={`absolute top-0 left-0 flex items-center text-green-400 transition-all duration-1000 ease-in-out ${
            animStep <= 0 ? 'translate-x-[2.5em] translate-y-[0.55em]' :
            animStep === 1 ? 'translate-x-[2.8em] translate-y-[0.55em]' :
            'translate-x-0 translate-y-[1.1em]'
          }`}>
            <span>N</span>
            <span className={`overflow-hidden transition-all duration-1000 ease-in-out ${animStep >= 1 ? 'max-w-[10em] opacity-100' : 'max-w-0 opacity-0'}`}>
              eighbors
            </span>
          </div>
        </h1>
        
        <div className={`grid transition-all duration-1000 ease-in-out w-full ${animStep >= 2 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
          <div className="overflow-hidden">
            <div className="pt-4">
              <p className="text-green-200 dark:text-gray-400 text-lg max-w-md mx-auto lg:mx-0">
                Connecting Philly creators with local businesses — matched by vibe, not keywords.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mt-8 pb-2">
                {['🎵 Live Music', '🎨 Visual Art', '📸 Food Influencer', '🎬 Video & Film', '🖌️ Muralists'].map(tag => (
                  <span key={tag} className="bg-green-800 dark:bg-gray-900 border border-transparent dark:border-gray-800 text-green-200 dark:text-gray-300 text-sm px-4 py-2 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form - Right Side */}
      <div className={`lg:w-1/2 p-6 flex justify-center items-center transition-all duration-1000 ease-in-out ${animStep >= 2 ? 'opacity-100 translate-x-0' : 'h-0 lg:h-auto w-0 opacity-0 translate-x-8 pointer-events-none overflow-hidden lg:overflow-visible'}`}>
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
