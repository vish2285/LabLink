import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { matchProfessors } from '../lib/api'

export default function ProfileForm() {
  const navigate = useNavigate()
  const { setProfile, setResults } = useApp()
  const [interests, setInterests] = useState('')
  const [skills, setSkills] = useState('')
  const [department, setDepartment] = useState('')
  const [departments] = useState<string[]>([
    'Computer Science',
    'Electrical and Computer Engineering',
    'Mechanical Engineering',
    'Civil and Environmental Engineering',
    'Biomedical Engineering',
    'Mathematics',
    'Statistics',
    'Physics',
    'Chemistry',
    'Biology',
  ])
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
      const results = await matchProfessors(payload, department || undefined)
      setResults(results)
      navigate('/results')
    } catch (err: any) {
      setError(err?.message || 'Failed to match')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6" id="profile">
      <div className="mx-auto w-full max-w-3xl rounded-xl border bg-white p-6 shadow-sm text-center">
        <h1 className="text-xl font-semibold">Your Research Profile</h1>
        <p className="mt-1 text-sm text-gray-600">Add interests and skills to find matching UC Davis professors.</p>
        <form onSubmit={onSubmit} className="mt-5 grid gap-5 justify-items-center">
          <div className="w-full max-w-md">
            <label className="block text-sm font-medium">Department</label>
            <select
              className="mt-1 w-full rounded-lg border px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={department}
              onChange={e => setDepartment(e.target.value)}
            >
              <option value="" disabled>Select a department</option>
              {departments.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>
          <div className="w-full max-w-md">
            <label className="block text-sm font-medium">Interests</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={interests}
              onChange={e => setInterests(e.target.value)}
              placeholder="machine learning, systems, NLP"
            />
            <p className="mt-1 text-xs text-gray-500">Comma separated</p>
          </div>
          <div className="w-full max-w-md">
            <label className="block text-sm font-medium">Skills</label>
            <input
              className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={skills}
              onChange={e => setSkills(e.target.value)}
              placeholder="python, pytorch, rust"
            />
            <p className="mt-1 text-xs text-gray-500">Comma separated</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-center w-full">
            <button
              type="submit"
              className="rounded-lg bg-[#002855] px-5 py-2.5 text-white shadow hover:opacity-90 disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Matching…' : 'Find Matches'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


