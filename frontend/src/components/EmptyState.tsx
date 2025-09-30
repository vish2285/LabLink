import { Link } from 'react-router-dom'

export default function EmptyState() {
  return (
    <div className="flex items-center justify-center bg-gray-50 py-16 min-h-[60vh]">
      <div className="mx-auto w-full max-w-3xl rounded-xl border bg-white p-6 shadow-sm text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No matches yet</h2>
        <p className="text-gray-600 mb-6">Let's find your perfect Cownect.</p>
        <Link to="/profile" className="inline-flex items-center gap-2 rounded-lg bg-[#002855] px-5 py-2.5 text-white shadow hover:opacity-90">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Profile
        </Link>
      </div>
    </div>
  )
}
