import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)
const USER_KEY = 'firebomba_user'

// Returns true if a JWT is missing, malformed, or past its `exp` claim.
function isTokenExpired(token) {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (!payload.exp) return false // no expiry claim -> treat as valid
    return payload.exp * 1000 <= Date.now()
  } catch {
    return true // malformed token
  }
}

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    const stored = raw ? JSON.parse(raw) : null
    if (!stored || isTokenExpired(stored.token)) {
      localStorage.removeItem(USER_KEY)
      return null
    }
    return stored
  } catch {
    return null
  }
}

export function AppProvider({ children }) {
  const [user, setUserState] = useState(() => loadUser())

  const setUser = (u) => {
    try {
      if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
      else localStorage.removeItem(USER_KEY)
    } catch {}
    setUserState(u)
  }

  return (
    <AppContext.Provider value={{ user, setUser }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
