import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { matchProfessors } from '../lib/api'

export default function ProfileForm() {
  const navigate = useNavigate()
  const { setProfile, setResults } = useApp()
  const [interests, setInterests] = useState('')
  const [skills, setSkills] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload = {
        interests: interests.split(',').map(s => s.trim()).filter(Boolean),
        skills: skills.split(',').map(s => s.trim()).filter(Boolean),
      }
      setProfile(payload)
      const results = await matchProfessors(payload)
      setResults(results)
      navigate('/results')
    } catch (err: any) {
      setError(err?.message || 'Failed to match')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Your Research Profile</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Interests (comma separated)</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={interests}
            onChange={e => setInterests(e.target.value)}
            placeholder="machine learning, systems, NLP"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Skills (comma separated)</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2"
            value={skills}
            onChange={e => setSkills(e.target.value)}
            placeholder="python, pytorch, rust"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Matching…' : 'Find Matches'}
        </button>
      </form>
    </div>
  )
}


