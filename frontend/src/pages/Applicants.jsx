// ─── What this file does ──────────────────────────────────────────────────────
// Shows a business who applied to one of their gigs.
// Each card shows the artist's profile — name, category, skills, gig count,
// instagram, portfolio — everything needed to decide without a back-and-forth.
//
// This is the "contact handoff" moment — business sees enough info to
// reach out directly. No in-app messaging needed.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const AVATAR_COLORS = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500']

const CATEGORY_STYLE = {
  'Live Music': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  'Food Influencer': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  'Social Influencer': 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  'Visual Art': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  'Muralist': 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  'Brand Design': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'Video / Film': 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'Photography': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  'Community': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
}

export default function Applicants() {
  const { gigId } = useParams()
  const { user }  = useAuth()
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  useEffect(() => {
    fetch(`/api/applications/gig/${gigId}`, {
      headers: { Authorization: `Bearer ${user.access_token}` },
    })
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(data => setApplicants(data.applicants || []))
      .catch(() => setError('Could not load applicants.'))
      .finally(() => setLoading(false))
  }, [gigId])

  return (
    <div>
      <div className="bg-green-900 px-6 py-10">
        <div className="max-w-6xl mx-auto animate-fade-up">
          <Link to="/business" className="text-green-400 text-xs font-bold uppercase tracking-widest hover:underline">
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-black text-white mt-2">Applicants</h1>
          <p className="text-green-200 mt-1 text-sm">
            {loading ? 'Loading...' : `${applicants.length} creator${applicants.length !== 1 ? 's' : ''} applied to this gig.`}
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
        ) : applicants.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No applicants yet — share your gig!</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
            {applicants.map((a, i) => (
              <div key={a.application_id} className="card p-6 flex flex-col gap-3">
                {/* Avatar + name */}
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${AVATAR_COLORS[i % AVATAR_COLORS.length]} rounded-full flex items-center justify-center text-white font-black text-xl`}>
                    {(a.display_name || '?')[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{a.display_name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(a.category || '').split(',').map(c => c.trim()).filter(Boolean).map(cat => {
                        const style = CATEGORY_STYLE[cat] || 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                        return (
                          <span key={cat} className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${style}`}>
                            {cat}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Skills */}
                {a.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {a.skills.slice(0, 4).map(tag => (
                      <span key={tag} className="text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                <div className="flex gap-4 text-xs text-gray-400">
                  {a.location    && <span>📍 {a.location}</span>}
                  {a.gig_count > 0 && <span>🎯 {a.gig_count} gigs done</span>}
                </div>

                {/* Contact links */}
                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-gray-800">
                  {a.instagram && (
                    <a href={`https://instagram.com/${a.instagram.replace('@', '')}`}
                      target="_blank" rel="noreferrer"
                      className="flex-1 text-center py-2 rounded-xl border-2 border-pink-200 dark:border-pink-900 text-pink-600 dark:text-pink-400 text-xs font-bold hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors">
                      Instagram
                    </a>
                  )}
                  {a.portfolio_url && (
                    <a href={a.portfolio_url} target="_blank" rel="noreferrer"
                      className="flex-1 text-center py-2 rounded-xl border-2 border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 text-xs font-bold hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                      Portfolio
                    </a>
                  )}
                  {!a.instagram && !a.portfolio_url && (
                    <p className="text-xs text-gray-400 italic">No contact links added yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
