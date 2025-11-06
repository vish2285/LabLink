import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { API_BASE } from '../lib/api'

type AuthUser = {
  email: string
  name?: string
  picture?: string
}

type AuthContextValue = {
  isSignedIn: boolean
  user: AuthUser | null
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)

  // Hydrate session from cookie on mount
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
        if (resp.ok) {
          const u = await resp.json()
          if (u?.email) setUser({ email: u.email, name: u.name, picture: u.picture })
        }
      } catch {}
    })()
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    isSignedIn: Boolean(user),
    user,
    signOut: async () => {
      setUser(null)
      try { await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' }) } catch {}
    },
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}




