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
      <div className="space-y-4">
        <p>No results yet.</p>
        <Link to="/" className="text-blue-600 underline">Go back to profile</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Top Matches</h1>
      <ul className="divide-y rounded border bg-white">
        {results.map((p, i) => (
          <li key={i} className="p-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">{p.name}</p>
              {p.department && <p className="text-sm text-gray-600">{p.department}</p>}
              {!!p.interests?.length && (
                <p className="mt-1 text-sm text-gray-700">{p.interests.join(', ')}</p>
              )}
            </div>
            <button
              className="shrink-0 rounded bg-blue-600 px-3 py-1.5 text-white"
              onClick={() => handleSelect(i)}
            >
              Draft Email
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}


