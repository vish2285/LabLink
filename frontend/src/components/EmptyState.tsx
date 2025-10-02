import { Link } from 'react-router-dom'

export default function EmptyState() {
  return (
    <div className="flex items-center justify-center py-16 min-h-[60vh]">
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 p-6 shadow-sm text-center">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No matches found</h2>
        <p className="text-slate-700 dark:text-slate-300 mb-6">Try editing your interests or skills, then search again.</p>
        <Link to="/profile" className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a8a] px-5 py-2.5 text-white shadow hover:bg-[#2544a0]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Go back
        </Link>
      </div>
    </div>
  )
}
