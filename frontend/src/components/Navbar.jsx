// ─── What this file does ──────────────────────────────────────────────────────
// The top navigation bar — visible on every page.
//
// Shows different things depending on state:
//   Logged out → logo + Sign In link
//   Logged in as artist   → logo + "Creator Feed" + avatar + Sign Out
//   Logged in as business → logo + "Dashboard" + "Post a Gig" + avatar + Sign Out
//
// Also contains the dark/light mode toggle button.
// The sun/moon icon switches based on current theme.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Navbar({ dark, setDark }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  
  // Start hidden if we are on the login page so the initial animation is totally empty
  const [showLoginNav, setShowLoginNav] = useState(location.pathname !== '/login')

  useEffect(() => {
    if (location.pathname === '/login') {
      setShowLoginNav(false)
      const t = setTimeout(() => setShowLoginNav(true), 3100)
      return () => clearTimeout(t)
    } else {
      setShowLoginNav(true)
    }
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    setDropdownOpen(false)
    navigate('/login')
  }

  return (
    <nav className={`sticky top-0 z-50 transition-colors duration-300 ${
      location.pathname === '/login'
        ? 'bg-green-900 dark:bg-gray-950 border-none'
        : 'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800'
    }`}>
      <div className={`max-w-6xl mx-auto px-6 h-14 flex items-center justify-between transition-all duration-1000 ${!showLoginNav ? 'opacity-0 pointer-events-none -translate-y-4' : 'opacity-100 translate-y-0'}`}>

        {/* Logo */}
        {location.pathname !== '/login' ? (
          <Link to="/" className="font-black text-green-700 dark:text-green-400 text-lg tracking-tight">
            Good Neighbors
          </Link>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">

          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(!dark)}
            className={`w-9 h-9 flex items-center justify-center rounded-full border transition-colors ${
              location.pathname === '/login'
                ? 'border-green-400 text-green-400 hover:bg-green-400/10 dark:border-white dark:text-white dark:hover:bg-white/10'
                : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            aria-label="Toggle dark mode"
          >
            {dark ? '☀️' : '🌙'}
          </button>

          {user ? (
            <>
              {/* Role-based nav links */}
              {user.role === 'artist' && (
                <Link to="/artist" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                  My Feed
                </Link>
              )}
              {user.role === 'business' && (
                <>
                  <Link to="/business" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 transition-colors">
                    Dashboard
                  </Link>
                  <Link to="/business/post-gig" className="btn bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2">
                    + Post Gig
                  </Link>
                </>
              )}

              {/* Profile Dropdown */}
              <div className="relative pl-2 border-l border-gray-200 dark:border-gray-700" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-black text-sm hover:bg-green-700 transition-colors">
                    {(user.display_name || 'U')[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 hidden sm:block hover:text-green-600 dark:hover:text-green-400 transition-colors">
                    {user.display_name}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-scale-in">
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                        {user.role === 'business' ? '🏢 Business Account' : '🎨 Creator Account'}
                      </p>
                      <p className="text-lg font-black text-gray-900 dark:text-white truncate">
                        {user.display_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate mb-4">
                        {user.email}
                      </p>
                      
                      <Link 
                        to={`/profile/${user.role}/${user.user_id}`} 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center justify-center w-full py-2 bg-green-50 dark:bg-green-900/40 border border-green-200 dark:border-green-800 rounded-xl text-sm font-bold text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/60 transition-all duration-200 mb-2"
                      >
                        View My Profile
                      </Link>
                      
                      <Link 
                        to="/setup" 
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center justify-center w-full py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:border-green-400 hover:text-green-600 dark:hover:border-green-500 dark:hover:text-green-400 transition-all duration-200"
                      >
                        Edit Details
                      </Link>
                    </div>
                    
                    <div className="p-2">
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold rounded-xl transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : location.pathname !== '/login' ? (
            <Link to="/login" className="btn bg-green-600 hover:bg-green-700 text-white text-sm px-5 py-2">
              Sign In
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
