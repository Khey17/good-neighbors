// ─── What this file does ──────────────────────────────────────────────────────
// The main dashboard for businesses. Two sections:
//
// 1. YOUR GIGS — all gigs this business has posted, with applicant counts.
//    Clicking a gig shows who applied (links to /applicants page).
//
// 2. RECOMMENDED CREATORS — AI-matched artists for the first open gig.
//    Same embedding magic as the artist feed, just flipped.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const CATEGORY_STYLE = {
  'Food Influencer':             'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'Social Influencer':           'bg-pink-100   text-pink-700   dark:bg-pink-900/40   dark:text-pink-300',
  'Live Music':                  'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Video / Film':                'bg-red-100    text-red-700    dark:bg-red-900/40    dark:text-red-300',
  'Brand Design':                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'Muralist':                    'bg-teal-100   text-teal-700   dark:bg-teal-900/40   dark:text-teal-300',
  'Food + Lifestyle Influencer': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'Photography':                 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
}

const AVATAR_COLORS = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500']

function formatDate(str) {
  if (!str) return null
  try { return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return str }
}

export default function BusinessDashboard() {
  const { user } = useAuth()
  const [gigs, setGigs]         = useState([])
  const [creators, setCreators] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return

    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.access_token}` }

        // 1. Fetch this business's gigs
        const gigsRes  = await fetch('/api/gigs/mine', { headers })
        const gigsData = gigsRes.ok ? await gigsRes.json() : null
        const myGigs   = gigsData?.gigs || []
        setGigs(myGigs)

        // 2. Match creators to the first open gig
        const firstOpen = myGigs.find(g => g.status === 'open')
        if (firstOpen) {
          const matchRes = await fetch(`/api/match/artists?gig_id=${firstOpen.id}`, { headers })
          if (matchRes.ok) {
            const matchData = await matchRes.json()
            setCreators(matchData.matches || [])
          }
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [user])

  const businessName = user?.display_name || 'Your Business'

  return (
    <div>
      <div className="bg-green-900 px-6 py-10">
        <div className="max-w-6xl mx-auto flex items-start justify-between animate-fade-up">
          <div>
            <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-1">Business Dashboard</p>
            <h1 className="text-3xl font-black text-white">{businessName}</h1>
            <p className="text-green-200 mt-1 text-sm">Manage your gigs and discover Philly's best local creators.</p>
          </div>
          <Link to="/business/post-gig" className="btn bg-green-400 text-green-900 px-5 py-2.5 text-sm whitespace-nowrap">
            + Post a Gig
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* Active Gigs */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Your Active Gigs</h2>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : gigs.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-8 text-center">
              <p className="text-gray-400 text-sm mb-2">No gigs posted yet.</p>
              <Link to="/business/post-gig" className="text-green-600 font-bold text-sm hover:underline">Post your first gig →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 stagger">
              {gigs.map(gig => {
                const catStyle = CATEGORY_STYLE[gig.category] || 'bg-gray-100 text-gray-600'
                return (
                  <div key={gig.id} className="card p-5">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${catStyle}`}>{gig.category}</span>
                      <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-bold px-3 py-1 rounded-full capitalize">{gig.status}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm leading-snug mb-3">{gig.title}</h3>
                    <div className="flex gap-4 text-xs text-gray-400 mb-4">
                      {gig.date && <span>📅 {formatDate(gig.date)}</span>}
                      <span>👥 {gig.applicant_count ?? 0} applicant{(gig.applicant_count ?? 0) !== 1 ? 's' : ''}</span>
                    </div>
                    {gig.applicant_count > 0 && (
                      <Link
                        to={`/business/gig/${gig.id}/applicants`}
                        className="text-xs text-green-600 dark:text-green-400 font-bold hover:underline"
                      >
                        View applicants →
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Recommended Creators */}
        {creators.length > 0 && (
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Recommended Creators</h2>
              <p className="text-gray-400 text-xs mt-1">Matched by vibe — not keywords. Powered by AI.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
              {creators.map((creator, i) => {
                const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length]
                const matchPct   = Math.round((creator.match_score ?? 0) * 100)

                return (
                  <div key={creator.user_id} className="card p-5 flex flex-col">
                    <div className={`w-12 h-12 ${avatarColor} rounded-full flex items-center justify-center text-white font-black text-xl mb-3`}>
                      {(creator.display_name || '?')[0]}
                    </div>

                    <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm">{creator.display_name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1 mb-3">
                      {(creator.category || '').split(',').map(c => c.trim()).filter(Boolean).map(cat => {
                        const style = CATEGORY_STYLE[cat] || 'bg-gray-100 text-gray-600'
                        return (
                          <span key={cat} className={`text-xs font-bold px-2.5 py-1 rounded-full ${style}`}>
                            {cat}
                          </span>
                        )
                      })}
                    </div>

                    {creator.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {creator.skills.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="mt-auto space-y-2">
                      <div className="flex items-center justify-between">
                        {creator.location && <span className="text-xs text-gray-400">📍 {creator.location}</span>}
                        {matchPct > 0 && <span className="text-green-600 dark:text-green-400 font-bold text-sm">{matchPct}%</span>}
                      </div>
                      {matchPct > 0 && (
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                          <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${matchPct}%`, transition: 'width 0.8s ease' }} />
                        </div>
                      )}
                      {creator.gig_count > 0 && (
                        <p className="text-xs text-gray-400">🎯 {creator.gig_count} gig{creator.gig_count !== 1 ? 's' : ''} completed</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
