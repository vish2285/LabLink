import { useEffect } from 'react'

type Props = {
  onLogin?: (payload: any, idToken: string) => void
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
const ALLOWED_EMAIL_DOMAINS = String(import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS || 'ucdavis.edu')
  .split(',')
  .map(d => d.trim().toLowerCase())
  .filter(Boolean)

export default function GoogleAuth({ onLogin }: Props) {
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    if (!w.google?.accounts?.id) return

    const handleResponse = async (resp: any) => {
      const idToken = resp?.credential
      if (!idToken) return

      let payload: any | null = null
      try {
        const parts = idToken.split('.')
        if (parts.length === 3) {
          let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
          const pad = b64.length % 4
          if (pad) b64 += '='.repeat(4 - pad)
          payload = JSON.parse(atob(b64))
        }
      } catch {}

      // Enforce allowed domains client-side to avoid confusing UX
      try {
        const email: string | undefined = payload?.email
        const hd: string | undefined = payload?.hd
        const domain = email && email.includes('@') ? email.split('@').pop()?.toLowerCase() : undefined
        const allowed = new Set(ALLOWED_EMAIL_DOMAINS)
        if ((!domain || !allowed.has(domain)) && (!hd || !allowed.has(hd.toLowerCase()))) {
          alert(`Please sign in with your ${ALLOWED_EMAIL_DOMAINS.join(', ')} account.`)
          return
        }
      } catch {}

      try {
        // Post only the token; AuthContext will exchange it for a cookie
        window.postMessage({ type: 'google-auth', idToken }, '*')
        if (onLogin) onLogin(payload, idToken)
      } catch {}
    }

    try {
      w.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleResponse,
        auto_select: false,
      })
      const el = document.getElementById('googleSignInDiv')
      if (el) {
        // Force a generic "Sign in with Google" button (no email shown)
        w.google.accounts.id.renderButton(el, {
          type: 'standard',
          theme: 'filled_blue',
          text: 'signin_with',
          size: 'large',
          shape: 'pill',
          logo_alignment: 'left',
        })
      }
      try { w.google.accounts.id.disable_auto_select?.() } catch {}
    } catch {}
  }, [])

  return <div id="googleSignInDiv" className="flex justify-center" />
}


