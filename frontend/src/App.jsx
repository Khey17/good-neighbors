// ─── What this file does ──────────────────────────────────────────────────────
// The skeleton of the entire frontend. Three jobs:
//
// 1. ROUTING — maps URLs to pages.
//    /login → Login page, /artist → ArtistFeed, /business → BusinessDashboard
//    Uses React Router to do this without reloading the browser.
//
// 2. AUTH — wraps everything in AuthContext so every page knows who's logged in.
//
// 3. DARK MODE — stores the theme preference and toggles the "dark" class
//    on the <html> element. Tailwind watches for that class and switches styles.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import ProfileSetup from './pages/ProfileSetup'
import ArtistFeed from './pages/ArtistFeed'
import BusinessDashboard from './pages/BusinessDashboard'
import PostGig from './pages/PostGig'
import Applicants from './pages/Applicants'
import { AuthContext, getStoredUser, storeUser, clearStoredUser } from './lib/auth'

// ─── Route guard ──────────────────────────────────────────────────────────────
// Wraps pages that require login. If not logged in → redirect to /login.
// If logged in but wrong role → redirect to their own dashboard.
// We check localStorage directly as a fallback because React state updates
// are async — localStorage is always in sync.
function ProtectedRoute({ children, requiredRole }) {
  const currentUser = getStoredUser()
  if (!currentUser) return <Navigate to="/login" replace />
  if (requiredRole && currentUser.role !== requiredRole) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [user, setUser]   = useState(() => getStoredUser())
  const [dark, setDark]   = useState(() => localStorage.getItem('gn_theme') === 'dark')

  // Apply or remove the "dark" class on <html> whenever dark changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('gn_theme', dark ? 'dark' : 'light')
  }, [dark])

  const login = (data) => { storeUser(data); setUser(data) }
  const logout = () => { clearStoredUser(); setUser(null) }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
          <Navbar dark={dark} setDark={setDark} />
          <main>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route path="/setup" element={
                <ProtectedRoute><ProfileSetup /></ProtectedRoute>
              } />

              <Route path="/artist" element={
                <ProtectedRoute requiredRole="artist"><ArtistFeed /></ProtectedRoute>
              } />

              <Route path="/business" element={
                <ProtectedRoute requiredRole="business"><BusinessDashboard /></ProtectedRoute>
              } />

              <Route path="/business/post-gig" element={
                <ProtectedRoute requiredRole="business"><PostGig /></ProtectedRoute>
              } />

              <Route path="/business/gig/:gigId/applicants" element={
                <ProtectedRoute requiredRole="business"><Applicants /></ProtectedRoute>
              } />

              {/* Root: redirect based on role */}
              <Route path="/" element={
                !user ? <Navigate to="/login" replace /> :
                user.role === 'business' ? <Navigate to="/business" replace /> :
                <Navigate to="/artist" replace />
              } />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
