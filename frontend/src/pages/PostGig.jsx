// ─── What this file does ──────────────────────────────────────────────────────
// The "Post a Gig" form for businesses.
// Submits to POST /api/gigs which saves the gig and triggers
// AI embedding generation in the background.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const CATEGORIES = [
  'Live Music', 'Food Influencer', 'Social Influencer', 'Visual Art',
  'Muralist', 'Brand Design', 'Video / Film', 'Photography', 'Community',
]

export default function PostGig() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories]   = useState([])
  const [pay, setPay]               = useState('')
  const [location, setLocation]     = useState('')
  const [date, setDate]             = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/gigs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({ title, description, category: categories.join(', '), pay, location, date }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Failed to post gig.')
        return
      }

      navigate('/business', { replace: true })
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
          <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-1">New Gig</p>
          <h1 className="text-3xl font-black text-white">Post a Gig</h1>
          <p className="text-green-200 mt-1 text-sm">Be descriptive — the AI uses your description to match the right creators.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="card p-8 space-y-6 animate-scale-in">

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Title <span className="text-green-500">*</span>
            </label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Live Jazz for Saturday Brunch" className="field" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Description <span className="text-green-500">*</span>
            </label>
            <textarea required value={description} onChange={e => setDescription(e.target.value)}
              rows={4} placeholder="Describe the vibe, the crowd, the space, what you're looking for..."
              className="field resize-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Category <span className="text-green-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => {
                  setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
                }}
                  className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all duration-200 ${
                    categories.includes(cat)
                      ? 'border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:border-green-300'
                  }`}
                >{cat}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pay</label>
              <input type="text" value={pay} onChange={e => setPay(e.target.value)}
                placeholder="e.g. $300, Negotiable" className="field" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Rittenhouse" className="field" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="field" />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/business')}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-500 text-sm font-bold hover:border-gray-300 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading || !title || !description || categories.length === 0}
              className="flex-2 btn bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl text-sm disabled:opacity-50">
              {loading ? 'Posting...' : 'Post Gig →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
