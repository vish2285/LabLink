import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Results() {
  const navigate = useNavigate()
  const { results, selectProfessor, setEmailDraft } = useApp()

  function handleSelect(index: number) {
    const prof = results[index]
    selectProfessor(prof)
    const draft = `Hello Professor ${prof.name},\n\n` +
      `I'm a student interested in ${prof.interests?.join(', ') || 'your research areas'}. ` +
      `I'd love to learn more about opportunities to contribute to your lab.\n\n` +
      `Best,\n[Your Name]`
    setEmailDraft(draft)
    navigate('/email')
  }

  if (!results?.length) {
    return (
      <div className="mx-auto w-full max-w-3xl text-center space-y-2">
        <p>No results yet.</p>
        <Link to="/" className="text-blue-600 underline inline-block">Go back to profile</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto w-full max-w-3xl text-center">
        <h1 className="text-xl font-semibold">Top Matches</h1>
        <Link to="/" className="mt-1 inline-block text-sm text-blue-600 hover:underline">Edit profile</Link>
      </div>
      <div className="mx-auto w-full max-w-3xl grid gap-4">
        {results.map((p, i) => (
          <div key={i} className="rounded-xl border bg-white p-4 shadow-sm text-center">
            <div className="space-y-1">
              <p className="font-medium">{p.name}</p>
              {p.department && <p className="text-sm text-gray-600">{p.department}</p>}
              <span className="mx-auto inline-block rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">Match</span>
            </div>
            {!!p.interests?.length && (
              <p className="mt-2 line-clamp-2 text-sm text-gray-700">{p.interests.join(', ')}</p>
            )}
            <div className="mt-3 flex justify-center">
              <button
                className="rounded-lg bg-[#002855] px-3 py-1.5 text-sm text-white shadow hover:opacity-90"
                onClick={() => handleSelect(i)}
              >
                Draft Email
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


