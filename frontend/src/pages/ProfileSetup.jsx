// ─── What this file does ──────────────────────────────────────────────────────
// The profile setup page — shown to new artists right after signup.
//
// Collects: bio, category, skills, location, instagram, portfolio URL.
// On save: calls PUT /api/profiles/me which also triggers AI embedding
// generation in the background — this is what makes matching work.
//
// Without completing this, the artist feed won't show real matches.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const CATEGORIES = [
  'Food Influencer', 'Social Influencer', 'Live Music', 'Visual Art',
  'Muralist', 'Brand Design', 'Video / Film', 'Photography', 'Community',
]

export default function ProfileSetup() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [bio, setBio]               = useState('')
  const [categories, setCategories] = useState([])
  const [skillsRaw, setSkillsRaw]   = useState('')
  const [location, setLocation]     = useState('')
  const [instagram, setInstagram]   = useState('')
  const [portfolio, setPortfolio]   = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean)

    try {
      const res = await fetch('/api/profiles/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({
          display_name:  user.display_name,
          bio,
          category: categories.join(', '),
          skills,
          location,
          instagram,
          portfolio_url: portfolio,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Failed to save profile.')
        return
      }

      navigate('/artist', { replace: true })
    } catch {
      setError('Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="bg-green-900 px-6 py-10">
        <div className="max-w-2xl mx-auto animate-fade-up">
          <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-1">Welcome</p>
          <h1 className="text-3xl font-black text-white">Build your profile, {user?.display_name?.split(' ')[0]} 👋</h1>
          <p className="text-green-200 mt-1 text-sm">This is what businesses see — and what our AI uses to match you to gigs.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <form onSubmit={handleSave} className="card p-8 space-y-6 animate-scale-in">

          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Bio <span className="text-green-500">*</span>
            </label>
            <textarea
              required value={bio} onChange={e => setBio(e.target.value)}
              rows={4} placeholder="Tell businesses who you are, what you create, and what makes you you..."
              className="field resize-none"
            />
            <p className="text-xs text-gray-400 mt-1">This is the most important field — the AI uses it to match your vibe to gigs.</p>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Categories <span className="text-green-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat} type="button" onClick={() => {
                    setCategories(prev => 
                      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                    )
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all duration-200 ${
                    categories.includes(cat)
                      ? 'border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-green-300'
                  }`}
                >{cat}</button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Select all that apply.</p>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Skills</label>
            <input
              type="text" value={skillsRaw} onChange={e => setSkillsRaw(e.target.value)}
              placeholder="e.g. photography, editing, instagram, restaurants"
              className="field"
            />
            <p className="text-xs text-gray-400 mt-1">Comma-separated. Be specific — these feed the AI matching.</p>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Neighborhood</label>
            <input type="text" value={location} onChange={e => setLocation(e.target.value)}
              placeholder="e.g. South Philly, Fishtown, Center City" className="field" />
          </div>

          {/* Instagram + Portfolio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Instagram</label>
              <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)}
                placeholder="@yourhandle" className="field" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Portfolio URL</label>
              <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)}
                placeholder="https://yoursite.com" className="field" />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !bio || categories.length === 0}
            className="btn bg-green-600 hover:bg-green-700 text-white w-full py-3 rounded-xl text-sm font-bold disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Profile & Find My Matches →'}
          </button>
        </form>
      </div>
    </div>
  )
}
