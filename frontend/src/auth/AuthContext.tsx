import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { API_BASE } from '../lib/api'

type AuthUser = {
  email: string
  name?: string
  picture?: string
}

type AuthContextValue = {
  isSignedIn: boolean
  idToken: string | null
  user: AuthUser | null
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const TOKEN_KEY = 'google_id_token'
const USER_KEY = 'google_user'

function decodeIdToken(token: string): AuthUser | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    // Base64url decode with padding
    let b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4
    if (pad) b64 += '='.repeat(4 - pad)
    const json = JSON.parse(atob(b64))
    const email = typeof json.email === 'string' ? json.email : ''
    const user: AuthUser = {
      email,
      name: typeof json.name === 'string' ? json.name : undefined,
      picture: typeof json.picture === 'string' ? json.picture : undefined,
    }
    return user
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [idToken, setIdToken] = useState<string | null>(() => {
    try { return window.localStorage.getItem(TOKEN_KEY) } catch { return null }
  })
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = window.localStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as AuthUser) : null
    } catch { return null }
  })


  useEffect(() => {
    // Handle Google One Tap or standard button callbacks writing token to storage
    const handler = async (e: MessageEvent) => {
      if (!e?.data || typeof e.data !== 'object') return
      const payload = (e.data as any)
      if (payload?.type === 'google-auth' && payload?.idToken) {
        const token = String(payload.idToken)
        try {
          // Perform server-side login to set secure HttpOnly session cookie
          const resp = await fetch(`${API_BASE}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id_token: token }),
          })
          if (resp.ok) {
            const data = await resp.json().catch(() => null)
            if (data?.user) {
              setUser({ email: data.user.email, name: data.user.name, picture: data.user.picture })
              try { window.localStorage.setItem(USER_KEY, JSON.stringify(data.user)) } catch {}
            }
            // Keep token temporarily for bearer fallback/relogin
            try { window.localStorage.setItem(TOKEN_KEY, token) } catch {}
            setIdToken(token)
            return
          }
        } catch {}
        // Fallback: set local user from token if server login fails (dev)
        setIdToken(token)
        const u = decodeIdToken(token)
        if (u) {
          try { window.localStorage.setItem(USER_KEY, JSON.stringify(u)) } catch {}
          setUser(u)
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // Initialize GIS once for silent refresh with auto_select
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any
      const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID as string | undefined
      if (!clientId || !w.google?.accounts?.id) return
      w.google.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        callback: (resp: any) => {
          const token = resp?.credential
          if (token) {
            try {
              window.localStorage.setItem(TOKEN_KEY, token)
              window.postMessage({ type: 'google-auth', idToken: token }, '*')
            } catch {}
          }
        }
      })
    } catch {}
  }, [])

  // Decode exp from JWT
  function getExpiryMs(token: string | null): number | null {
    try {
      if (!token) return null
      const [, payload] = token.split('.')
      if (!payload) return null
      let b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
      const pad = b64.length % 4
      if (pad) b64 += '='.repeat(4 - pad)
      const data = JSON.parse(atob(b64))
      const exp = typeof data.exp === 'number' ? data.exp * 1000 : null
      return exp
    } catch { return null }
  }

  // Schedule quiet refresh ~5 minutes before expiry (for GIS One Tap)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    let timer: number | undefined
    const expMs = getExpiryMs(idToken)
    if (expMs && w.google?.accounts?.id?.prompt) {
      const now = Date.now()
      const lead = 5 * 60 * 1000
      const delay = Math.max(30_000, expMs - now - lead)
      timer = window.setTimeout(() => {
        try { w.google.accounts.id.prompt(() => {}) } catch {}
      }, delay)
    }
    return () => { if (timer) window.clearTimeout(timer) }
  }, [idToken])

  // Hydrate session from cookie on mount
  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' })
        if (resp.ok) {
          const u = await resp.json()
          if (u?.email) {
            setUser({ email: u.email, name: u.name, picture: u.picture })
            try { window.localStorage.setItem(USER_KEY, JSON.stringify(u)) } catch {}
          }
        }
      } catch {}
    })()
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    isSignedIn: Boolean(user || idToken),
    idToken,
    user,
    signOut: async () => {
      try { window.localStorage.removeItem(TOKEN_KEY); window.localStorage.removeItem(USER_KEY) } catch {}
      setIdToken(null)
      setUser(null)
      try { await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' }) } catch {}
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any
        const email = user?.email
        w.google?.accounts?.id?.disable_auto_select?.()
        if (email) w.google?.accounts?.id?.revoke?.(email, () => {})
      } catch {}
    },
  }), [idToken, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}




