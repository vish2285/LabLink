import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function EmailEditor() {
  const { selectedProfessor, emailDraft, setEmailDraft } = useApp()
  const subject = useMemo(
    () => (selectedProfessor ? `Prospective research with ${selectedProfessor.name}` : 'Prospective research inquiry'),
    [selectedProfessor]
  )

  return (
    <div className="space-y-4">
      {!selectedProfessor && (
        <p className="text-sm text-gray-600">No professor selected. <Link to="/results" className="text-blue-600 underline">Go to results</Link></p>
      )}
      <div>
        <label className="block text-sm font-medium">Subject</label>
        <input className="mt-1 w-full rounded border px-3 py-2" value={subject} readOnly />
      </div>
      <div>
        <label className="block text-sm font-medium">Body</label>
        <textarea
          className="mt-1 w-full rounded border px-3 py-2 h-64"
          value={emailDraft}
          onChange={e => setEmailDraft(e.target.value)}
        />
      </div>
      <div className="flex gap-3">
        <a
          className="rounded bg-blue-600 px-4 py-2 text-white"
          href={
            `mailto:${selectedProfessor?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailDraft)}`
          }
        >
          Open in Mail
        </a>
        <Link className="rounded border px-4 py-2" to="/results">Back to Results</Link>
      </div>
    </div>
  )
}


