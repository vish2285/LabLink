import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { API_BASE } from '../lib/api'

export default function SignIn() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  const { isSignedIn } = useAuth()

  // If already signed in, redirect away from sign-in page
  useEffect(() => {
    if (isSignedIn) {
      const target = (location.state && location.state.from) ? (location.state as any).from : '/'
      navigate(target, { replace: true })
    }
  }, [isSignedIn, location.state, navigate])

  const startClassicOAuth = () => {
    const origin = window.location.origin
    const fromPath = (location.state && (location.state as any).from) ? String((location.state as any).from) : '/'
    const returnAbs = `${origin}${fromPath.startsWith('/') ? fromPath : '/'}`
    const base = API_BASE || ''
    window.location.href = `${base}/api/oauth/start?returnTo=${encodeURIComponent(returnAbs)}`
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">Use your UC Davis Google account to continue</p>

        <div className="mt-6 flex flex-col items-center">
          <button
            type="button"
            onClick={startClassicOAuth}
            aria-label="Sign in with Google"
            className="inline-flex items-center justify-center gap-3 rounded-lg border border-slate-300/80 dark:border-white/20 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 px-4 py-2 shadow-sm"
          >
            {/* Google G logo */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.06 0 5.84 1.153 7.961 3.039l5.657-5.657C33.64 6.053 29.082 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z"/>
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.06 0 5.84 1.153 7.961 3.039l5.657-5.657C33.64 6.053 29.082 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.2-5.238C29.173 35.091 26.715 36 24 36c-5.203 0-9.616-3.317-11.277-7.946l-6.518 5.02C9.53 39.556 16.227 44 24 44z"/>
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.094 5.57l.003-.002 6.2 5.238C35.211 41.799 40 38 42.708 32.594c.868-2.024 1.354-4.258 1.354-6.594 0-1.341-.138-2.651-.451-3.917z"/>
            </svg>
            <span className="text-sm font-medium">Sign in with Google</span>
          </button>
        </div>

        <div className="mt-5 text-sm text-slate-600 dark:text-slate-300">
          <p>Only <span className="font-mono">@ucdavis.edu</span> emails are allowed.</p>
        </div>
      </div>
    </div>
  )
}


