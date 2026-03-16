// ─── What this file does ──────────────────────────────────────────────────────
// Manages who is logged in across the entire app.
//
// Two problems it solves:
//
// 1. SHARING STATE — any page needs to know "who is logged in right now?"
//    React's Context API lets us store that in one place and read it anywhere.
//    Think of it like a whiteboard in the office — anyone can look at it.
//
// 2. SURVIVING REFRESH — if you reload the page, React state resets to zero.
//    So we also save the user to localStorage (the browser's mini storage).
//    On refresh, we read it back and the user stays logged in.
// ──────────────────────────────────────────────────────────────────────────────

import { createContext, useContext } from 'react'

const KEY = 'gn_user'

// Read the stored user from localStorage (returns null if not logged in)
export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) }
  catch { return null }
}

export const storeUser   = (data) => localStorage.setItem(KEY, JSON.stringify(data))
export const clearStoredUser = () => localStorage.removeItem(KEY)

// The "whiteboard" — any component can read from this
export const AuthContext = createContext(null)

// useAuth() is the hook components use to read the whiteboard:
//   const { user, login, logout } = useAuth()
export const useAuth = () => useContext(AuthContext)
