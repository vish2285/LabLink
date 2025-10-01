import { createContext, useContext, useEffect, useMemo, useState } from 'react'

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
  const [idToken, setIdToken] = useState<string | null>(
    () => window.localStorage.getItem(TOKEN_KEY)
  )
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = window.localStorage.getItem(USER_KEY)
    if (raw) return JSON.parse(raw) as AuthUser
    const t = window.localStorage.getItem(TOKEN_KEY)
    return t ? decodeIdToken(t) : null
  })

  useEffect(() => {
    // Handle Google One Tap or standard button callbacks writing token to storage
    const handler = (e: MessageEvent) => {
      if (!e?.data || typeof e.data !== 'object') return
      const payload = (e.data as any)
      if (payload?.type === 'google-auth' && payload?.idToken) {
        const token = String(payload.idToken)
        window.localStorage.setItem(TOKEN_KEY, token)
        setIdToken(token)
        let nextUser: AuthUser | null = null
        if (payload.user) {
          nextUser = payload.user as AuthUser
        } else {
          nextUser = decodeIdToken(token)
        }
        if (nextUser) {
          window.localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
          setUser(nextUser)
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    isSignedIn: Boolean(idToken),
    idToken,
    user,
    signOut: () => {
      window.localStorage.removeItem(TOKEN_KEY)
      window.localStorage.removeItem(USER_KEY)
      setIdToken(null)
      setUser(null)
      // Optional: fully revoke Google session to force chooser next time
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


