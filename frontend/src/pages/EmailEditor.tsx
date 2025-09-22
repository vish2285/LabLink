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
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        {!selectedProfessor && (
          <p className="text-sm text-gray-600">No professor selected. <Link to="/results" className="text-blue-600 underline">Go to results</Link></p>
        )}
        <div className="grid gap-5">
          <div>
            <label className="block text-sm font-medium">Subject</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={subject} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium">Body</label>
            <textarea
              className="mt-1 h-64 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={emailDraft}
              onChange={e => setEmailDraft(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <a
              className="rounded-lg bg-[#002855] px-4 py-2 text-white shadow hover:opacity-90"
              href={
                `mailto:${selectedProfessor?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailDraft)}`
              }
            >
              Open in Mail
            </a>
            <Link className="rounded-lg border px-4 py-2 shadow-sm" to="/results">Back to Results</Link>
          </div>
        </div>
      </div>
    </div>
  )
}


