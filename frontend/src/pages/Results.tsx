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
      `I'm a student interested in ${prof.research_interests || 'your research areas'}. ` +
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
          <div key={i} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="space-y-2">
              <div className="text-center">
                <p className="font-medium">{p.name}</p>
                {p.department && <p className="text-sm text-gray-600">{p.department}</p>}
                {p.score_percent && (
                  <span className="mx-auto inline-block rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">
                    {p.score_percent}% match
                  </span>
                )}
              </div>
              {p.research_interests && (
                <p className="line-clamp-2 text-sm text-gray-700">{p.research_interests}</p>
              )}
              {p.skills && p.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {p.skills.slice(0, 5).map((skill, idx) => (
                    <span key={idx} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {skill}
                    </span>
                  ))}
                  {p.skills.length > 5 && (
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      +{p.skills.length - 5} more
                    </span>
                  )}
                </div>
              )}
              {p.why && (
                <div className="text-xs text-gray-500">
                  <div className="flex flex-wrap gap-2">
                    {p.why.interests_hits.length > 0 && (
                      <span>Interests: {p.why.interests_hits.slice(0, 3).join(', ')}</span>
                    )}
                    {p.why.skills_hits.length > 0 && (
                      <span>Skills: {p.why.skills_hits.slice(0, 3).join(', ')}</span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-center pt-2">
                <button
                  className="rounded-lg bg-[#002855] px-3 py-1.5 text-sm text-white shadow hover:opacity-90"
                  onClick={() => handleSelect(i)}
                >
                  Draft Email
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


