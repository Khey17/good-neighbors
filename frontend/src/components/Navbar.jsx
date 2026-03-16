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

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function Navbar({ dark, setDark }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="font-black text-green-700 dark:text-green-400 text-lg tracking-tight">
          Good Neighbors
        </Link>

        <div className="flex items-center gap-3">

          {/* Dark mode toggle */}
          <button
            onClick={() => setDark(!dark)}
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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

              {/* Avatar + name */}
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white font-black text-sm">
                  {(user.display_name || 'U')[0].toUpperCase()}
                </div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 hidden sm:block">
                  {user.display_name}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 font-bold transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn bg-green-600 hover:bg-green-700 text-white text-sm px-5 py-2">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
