// ─── What this file does ──────────────────────────────────────────────────────
// The main feed for artists — shows gigs ranked by AI match score.
//
// On load: calls GET /api/match/gigs which runs the pgvector similarity
// search and returns gigs sorted by how closely they match the artist's
// embedding. Highest match score at the top.
//
// Apply button: calls POST /api/applications/{gig_id}
// Once applied, the button changes to "✓ Applied" and is disabled.
// No form. No questions. That's the whole point.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const CATEGORY_STYLE = {
  'Live Music':        'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Food Influencer':   'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'Social Influencer': 'bg-pink-100   text-pink-700   dark:bg-pink-900/40   dark:text-pink-300',
  'Visual Art':        'bg-blue-100   text-blue-700   dark:bg-blue-900/40   dark:text-blue-300',
  'Muralist':          'bg-teal-100   text-teal-700   dark:bg-teal-900/40   dark:text-teal-300',
  'Brand Design':      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'Video / Film':      'bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-300',
  'Photography':       'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'Community':         'bg-green-100  text-green-700  dark:bg-green-900/40  dark:text-green-300',
}

function formatDate(str) {
  if (!str) return null
  try { return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return str }
}

export default function ArtistFeed() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [gigs, setGigs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [applied, setApplied] = useState(new Set())
  const [applying, setApplying] = useState(null)

  useEffect(() => {
    if (!user) return
    fetch('/api/match/gigs', {
      headers: { Authorization: `Bearer ${user.access_token}` },
    })
      .then(res => {
        if (res.status === 409) {
          // Profile incomplete — no embedding yet
          navigate('/setup', { replace: true })
          return null
        }
        return res.json()
      })
      .then(data => { if (data) setGigs(data.matches || []) })
      .catch(() => setError('Could not load gigs. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [user])

  const handleApply = async (gigId) => {
    setApplying(gigId)
    try {
      const res = await fetch(`/api/applications/${gigId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.access_token}` },
      })
      if (res.ok || res.status === 409) {
        setApplied(prev => new Set(prev).add(gigId))
      }
    } finally {
      setApplying(null)
    }
  }

  const firstName = user?.display_name?.split(' ')[0] || 'there'

  return (
    <div>
      <div className="bg-green-900 px-6 py-10">
        <div className="max-w-6xl mx-auto animate-fade-up">
          <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-1">Creator Feed</p>
          <h1 className="text-3xl font-black text-white">Hey, {firstName} 👋</h1>
          <p className="text-green-200 mt-1 text-sm">
            {loading
              ? 'Finding your best gig matches...'
              : `${gigs.length} gigs matched to your vibe — ranked by AI, not keywords.`}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 text-sm">{error}</div>
        ) : gigs.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No gigs yet — check back soon.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {gigs.map(gig => {
              const catStyle  = CATEGORY_STYLE[gig.category] || 'bg-gray-100 text-gray-600'
              const matchPct  = Math.round((gig.match_score ?? 0) * 100)
              const isApplied = applied.has(gig.id)
              const isApplying = applying === gig.id

              return (
                <div key={gig.id} className="card p-5 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${catStyle}`}>{gig.category}</span>
                    {matchPct > 0 && <span className="text-green-600 dark:text-green-400 font-bold text-sm">{matchPct}% match</span>}
                  </div>

                  <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base leading-snug mb-1">{gig.title}</h2>
                  {gig.business_name && <p className="text-gray-400 text-xs mb-1">{gig.business_name}</p>}
                  {gig.description && <p className="text-gray-500 dark:text-gray-400 text-xs mb-3 line-clamp-2">{gig.description}</p>}

                  {matchPct > 0 && (
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mb-4">
                      <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${matchPct}%`, transition: 'width 0.8s ease' }} />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mb-5">
                    {gig.pay      && <span className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full">💰 {gig.pay}</span>}
                    {gig.date     && <span className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full">📅 {formatDate(gig.date)}</span>}
                    {gig.location && <span className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 px-3 py-1 rounded-full">📍 {gig.location}</span>}
                  </div>

                  <button
                    onClick={() => handleApply(gig.id)}
                    disabled={isApplied || isApplying}
                    className={`mt-auto w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                      isApplied
                        ? 'bg-green-50 dark:bg-green-900/30 text-green-600 border-2 border-green-200 dark:border-green-800 cursor-not-allowed'
                        : 'btn bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {isApplying ? '...' : isApplied ? '✓ Applied!' : 'Apply Now'}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
