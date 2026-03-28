import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

const CATEGORIES = [
  'Food Influencer', 'Social Influencer', 'Live Music', 'Visual Art',
  'Muralist', 'Brand Design', 'Video / Film', 'Photography', 'Community',
]

export default function ProfileSetup() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const isBusiness = user?.role === 'business'

  const [bio, setBio]               = useState('')
  const [categories, setCategories] = useState([])
  const [skillsRaw, setSkillsRaw]   = useState('')
  const [location, setLocation]     = useState('')
  const [instagram, setInstagram]   = useState('')
  const [portfolio, setPortfolio]   = useState('')
  const [portfolioMedia, setPortfolioMedia] = useState([])
  const [loading, setLoading]       = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [viewMedia, setViewMedia]   = useState(null)
  const [error, setError]           = useState('')

  // Load existing profile if they are coming back to edit
  useEffect(() => {
    if (!user) return
    fetch('/api/profiles/me', {
      headers: { Authorization: `Bearer ${user.access_token}` },
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setBio(isBusiness ? (data.description || '') : (data.bio || ''))
          const catStr = isBusiness ? data.industry : data.category
          setCategories(catStr ? catStr.split(',').map(c => c.trim()).filter(Boolean) : [])
          setSkillsRaw(data.skills ? data.skills.join(', ') : '')
          setLocation(data.location || '')
          setInstagram(data.instagram || '')
          setPortfolio(data.portfolio_url || '')
          setPortfolioMedia(data.portfolio_media || [])
        }
      })
      .catch(() => {})
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean)

    const payload = isBusiness 
      ? {
          business_name: user.display_name,
          description: bio,
          industry: categories.join(', '),
          skills,
          location,
          instagram,
          portfolio_url: portfolio,
          portfolio_media: portfolioMedia,
        }
      : {
          display_name:  user.display_name,
          bio,
          category: categories.join(', '),
          skills,
          location,
          instagram,
          portfolio_url: portfolio,
          portfolio_media: portfolioMedia,
        }

    try {
      const res = await fetch('/api/profiles/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.detail || 'Failed to save profile.')
        return
      }

      navigate(isBusiness ? '/business' : '/artist', { replace: true })
    } catch {
      setError('Could not reach the server.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    setUploading(true)
    setError('')

    const newMedia = []
    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/profiles/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${user.access_token}` },
          body: formData,
        })

        if (!res.ok) {
          const errText = await res.text()
          throw new Error(`Server Error: ${errText}`)
        }
        
        const data = await res.json()
        newMedia.push(data.url)
      }
      setPortfolioMedia(prev => [...prev, ...newMedia])
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const removeMedia = (urlToRemove) => {
    setPortfolioMedia(prev => prev.filter(url => url !== urlToRemove))
  }

  return (
    <div>
      <div className="bg-green-900 px-6 py-10">
        <div className="max-w-3xl mx-auto animate-fade-up">
          <button
            onClick={() => navigate(-1)}
            className="text-green-400 text-xs font-bold uppercase tracking-widest hover:underline mb-3 block"
          >
            ← Cancel
          </button>
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-1">
                Edit Your Profile
              </p>
              <h1 className="text-3xl font-black text-white">
                {user.display_name || user.email.split('@')[0]}
              </h1>
            </div>
            <button 
              type="button"
              onClick={handleSave} 
              disabled={loading || !bio || categories.length === 0}
              className="px-6 py-2.5 bg-green-500 hover:bg-green-400 text-green-950 font-black rounded-full shadow-lg transition-transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <form onSubmit={handleSave} className="card p-6 flex flex-col gap-6 animate-scale-in">
          
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 shrink-0 bg-green-500 rounded-full flex items-center justify-center text-white font-black text-3xl shadow-md">
              {(user.display_name || '?')[0].toUpperCase()}
            </div>
            <div className="w-full flex-1">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Display Name</label>
              <input type="text" value={user.display_name || ''} disabled className="field bg-gray-50 dark:bg-gray-900/50 cursor-not-allowed opacity-80" />
            </div>
            <div className="w-full flex-1">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                placeholder="e.g. Center City" className="field bg-transparent border-gray-200 dark:border-gray-800 focus:border-green-500 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              {isBusiness ? 'Categories / Vibe' : 'Creator Category'} <span className="text-green-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat} type="button" onClick={() => {
                    setCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all duration-200 ${
                    categories.includes(cat)
                      ? 'border-green-600 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'border-gray-200 dark:border-gray-800 text-gray-500 hover:border-gray-300 dark:hover:border-gray-700'
                  }`}
                >{cat}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              {isBusiness ? 'About the Business' : 'Creator Bio'} <span className="text-green-500">*</span>
            </label>
            <textarea
              required value={bio} onChange={e => setBio(e.target.value)}
              rows={4} placeholder={isBusiness ? "Describe what you do..." : "Tell businesses your story..."}
              className="field resize-none bg-transparent border-gray-200 dark:border-gray-800 focus:border-green-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              {isBusiness ? 'Business Tags' : 'Skills'}
            </label>
            <input
              type="text" value={skillsRaw} onChange={e => setSkillsRaw(e.target.value)}
              placeholder="e.g. photography, editing, restaurants (comma-separated)"
              className="field bg-transparent border-gray-200 dark:border-gray-800 focus:border-green-500 transition-colors"
            />
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex-1 text-center py-2.5 rounded-xl border-2 border-pink-200 dark:border-pink-900 focus-within:border-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900/10 transition-colors overflow-hidden">
               <input type="text" value={instagram} onChange={e => setInstagram(e.target.value)}
                placeholder="IG: @handle" className="w-full text-center text-pink-600 dark:text-pink-400 text-sm font-bold bg-transparent outline-none placeholder:text-pink-300 dark:placeholder:text-pink-800" />
            </div>
            <div className="flex-1 text-center py-2.5 rounded-xl border-2 border-green-200 dark:border-green-900 focus-within:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors overflow-hidden">
              <input type="url" value={portfolio} onChange={e => setPortfolio(e.target.value)}
                placeholder="Portfolio Link" className="w-full text-center text-green-600 dark:text-green-400 text-sm font-bold bg-transparent outline-none placeholder:text-green-300 dark:placeholder:text-green-800" />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl px-4 py-3">
              {error}
            </div>
          )}
        </form>

        <div className="mt-8">
          <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-4 mb-4">
            <span className="text-sm font-bold uppercase tracking-widest text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2 2h20v20H2zm2 2v16h16V4zm4 4h8v8H8z"/></svg>
              Manage Portfolio
            </span>
            {uploading && <span className="text-xs font-bold text-green-500 animate-pulse">Uploading...</span>}
          </div>

          <div className="grid grid-cols-3 gap-1 md:gap-2">
            {portfolioMedia.map((url, i) => {
              const isVideo = url.match(/\.(mp4|webm|ogg|mov)$/i)
              return (
                <div key={i} className="relative group aspect-square bg-gray-100 dark:bg-gray-900 overflow-hidden cursor-pointer" onClick={() => setViewMedia(url)}>
                  {isVideo ? (
                    <>
                      <video src={url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]" muted />
                      <div className="absolute top-2 right-2 flex items-center justify-center drop-shadow-md">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    </>
                  ) : (
                    <img src={url} alt="Portfolio item" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.05]" />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); removeMedia(url) }}
                      className="bg-red-500 hover:bg-red-600 active:scale-95 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg pointer-events-auto transition-transform"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}

            {/* Upload Button matches the grid perfectly */}
            <label className={`relative aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden ${uploading ? 'border-green-400 bg-green-50 dark:bg-green-900/10' : 'border-gray-300 hover:border-green-400 dark:border-gray-700 dark:hover:border-green-500 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
              <input 
                type="file" multiple accept="image/*,video/*" 
                onChange={handleFileUpload} disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
              />
              <div className="text-gray-400 flex flex-col items-center gap-2">
                <svg className="w-8 h-8 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                <span className="text-xs font-bold uppercase tracking-widest">Add Media</span>
              </div>
            </label>
          </div>
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
    </div>
  )
}
