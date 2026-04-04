import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function PublicProfile() {
  const { role, id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/profiles/${role}/${id}`)
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(data => setProfile(data))
      .catch(() => setError('Profile not found.'))
      .finally(() => setLoading(false))
  }, [role, id])

  return (
    <div>
      <div className="bg-green-900 px-6 py-10">
        <div className="max-w-3xl mx-auto animate-fade-up">
          <button
            onClick={() => navigate(-1)}
            className="text-green-400 text-xs font-bold uppercase tracking-widest hover:underline mb-3 block"
          >
            ← Back
          </button>
          
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-1">
                {role === 'artist' ? 'Artist Profile' : 'Business Profile'}
              </p>
              <h1 className="text-3xl font-black text-white">
                {loading ? '...' : profile?.display_name || profile?.business_name || 'Profile'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 text-sm">{error}</div>
        ) : profile && role === 'artist' ? (
          <ArtistView profile={profile} />
        ) : profile && role === 'business' ? (
          <BusinessView profile={profile} />
        ) : null}
        
        {profile && <PortfolioGallery media={profile.portfolio_media} />}
      </div>
    </div>
  )
}

function PortfolioGallery({ media }) {
  const [viewMedia, setViewMedia] = useState(null);
  
  if (!media || media.length === 0) return null;
  return (
    <div className="mt-8">
      <div className="flex items-center justify-center border-t border-gray-200 dark:border-gray-800 pt-4 mb-4">
        <span className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2 2h20v20H2zm2 2v16h16V4zm4 4h8v8H8z"/></svg>
          Portfolio
        </span>
      </div>
      <div className="grid grid-cols-3 gap-1 md:gap-2">
        {media.map((url, i) => {
          const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i);
          return isVideo ? (
            <div key={i} className="relative group aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden cursor-pointer" onClick={() => setViewMedia(url)}>
              <video src={url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]" muted />
              {/* Top-right video icon */}
              <div className="absolute top-2 right-2 flex items-center justify-center drop-shadow-md">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all pointer-events-none" />
            </div>
          ) : (
            <div key={i} className="relative group aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden cursor-pointer" onClick={() => setViewMedia(url)}>
              <img src={url} alt="Portfolio item" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all pointer-events-none" />
            </div>
          );
        })}
      </div>

      {viewMedia && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setViewMedia(null)}>
          <button onClick={() => setViewMedia(null)} className="absolute top-6 right-6 text-white font-bold text-xl bg-white/10 hover:bg-white hover:text-black rounded-full w-10 h-10 flex items-center justify-center transition-colors shadow-lg backdrop-blur-sm z-[110]">
            &times;
          </button>
          <div className="relative max-w-6xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {viewMedia.match(/\.(mp4|webm|ogg|mov)$/i) ? (
              <video src={viewMedia} controls autoPlay className="max-w-full max-h-[90vh] rounded-xl shadow-2xl outline-none" />
            ) : (
              <img src={viewMedia} alt="Expanded view" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ArtistView({ profile }) {
  return (
    <div className="card p-6 flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white font-black text-2xl">
          {(profile.display_name || '?')[0]}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{profile.display_name}</h2>
          {profile.category && <p className="text-sm text-gray-400">{profile.category}</p>}
          {profile.location && <p className="text-xs text-gray-400">📍 {profile.location}</p>}
        </div>
      </div>

      {profile.bio && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">About</p>
          <p className="text-gray-700 dark:text-gray-300 text-sm">{profile.bio}</p>
        </div>
      )}

      {profile.skills?.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Skills</p>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map(s => (
              <span key={s} className="text-xs bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full">{s}</span>
            ))}
          </div>
        </div>
      )}

      {profile.gig_count > 0 && (
        <p className="text-sm text-gray-400">🎯 {profile.gig_count} gigs completed</p>
      )}

      <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        {profile.instagram && (
          <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
            target="_blank" rel="noreferrer"
            className="flex-1 text-center py-2.5 rounded-xl border-2 border-pink-200 dark:border-pink-900 text-pink-600 dark:text-pink-400 text-sm font-bold hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors">
            Instagram
          </a>
        )}
        {profile.portfolio_url && (
          <a href={profile.portfolio_url} target="_blank" rel="noreferrer"
            className="flex-1 text-center py-2.5 rounded-xl border-2 border-green-200 dark:border-green-900 text-green-600 dark:text-green-400 text-sm font-bold hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
            Portfolio
          </a>
        )}
        {!profile.instagram && !profile.portfolio_url && (
          <p className="text-xs text-gray-400 italic">No contact links added yet.</p>
        )}
      </div>
    </div>
  )
}

function BusinessView({ profile }) {
  return (
    <div className="card p-6 flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-black text-2xl">
          {(profile.business_name || '?')[0]}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{profile.business_name}</h2>
          {profile.industry && <p className="text-sm text-gray-400">{profile.industry}</p>}
          {profile.location && <p className="text-xs text-gray-400">📍 {profile.location}</p>}
        </div>
      </div>

      {profile.description && (
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">About</p>
          <p className="text-gray-700 dark:text-gray-300 text-sm">{profile.description}</p>
        </div>
      )}

      {profile.website && (
        <a href={profile.website} target="_blank" rel="noreferrer"
          className="inline-block text-center py-2.5 px-6 rounded-xl border-2 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 text-sm font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors w-fit">
          Visit Website
        </a>
      )}
    </div>
  )
}
