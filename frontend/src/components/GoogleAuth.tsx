import { useEffect } from 'react'

type Props = {
  onLogin?: (payload: any, idToken: string) => void
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

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

      // Enforce UC Davis domain client-side to avoid confusing UX
      try {
        const email: string | undefined = payload?.email
        const hd: string | undefined = payload?.hd
        const domain = email && email.includes('@') ? email.split('@').pop()?.toLowerCase() : undefined
        if ((domain !== 'ucdavis.edu') && ((hd || '').toLowerCase() !== 'ucdavis.edu')) {
          alert('Please use your @ucdavis.edu account to sign in.')
          return
        }
      } catch {}

      try {
        const user = payload ? {
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        } : undefined
        window.localStorage.setItem('google_id_token', idToken)
        if (user) window.localStorage.setItem('google_user', JSON.stringify(user))
        window.postMessage({ type: 'google-auth', idToken, user }, '*')
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
        w.google.accounts.id.renderButton(el, { theme: 'filled_blue', size: 'large', shape: 'pill' })
      }
      try { w.google.accounts.id.disable_auto_select?.() } catch {}
    } catch {}
  }, [])

  return <div id="googleSignInDiv" className="flex justify-center" />
}


