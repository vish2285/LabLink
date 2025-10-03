import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import GoogleAuth from '../components/GoogleAuth'
import { useAuth } from '../auth/AuthContext'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

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

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 shadow-md p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sign in</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-300">Use your UC Davis Google account to continue</p>

        <div className="mt-6 flex flex-col items-center">
          <GoogleAuth onLogin={() => {
            const target = (location.state && location.state.from) ? (location.state as any).from : '/'
            navigate(target, { replace: true })
          }} />
        </div>

        <div className="mt-5 text-sm text-slate-600 dark:text-slate-300">
          <p>Only <span className="font-mono">@ucdavis.edu</span> emails are allowed.</p>
        </div>

        {!GOOGLE_CLIENT_ID && (
          <p className="mt-3 text-sm text-red-600">Missing VITE_GOOGLE_CLIENT_ID</p>
        )}
      </div>
    </div>
  )
}


