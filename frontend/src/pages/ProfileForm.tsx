import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { matchProfessors, fetchDepartments } from '../lib/api'

export default function ProfileForm() {
  const navigate = useNavigate()
  const { setProfile, setResults, profile } = useApp()
  const [interests, setInterests] = useState(profile?.interests || '')
  const [skills, setSkills] = useState(profile?.skills || '')
  const [department, setDepartment] = useState(profile?.department || '')
  const [departments, setDepartments] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDepartments() {
      try {
        const deps = await fetchDepartments()
        setDepartments(deps)
      } catch (err) {
        console.error('Failed to load departments:', err)
        // Fallback to hardcoded departments if API fails
        setDepartments([
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
      }
    }
    loadDepartments()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload = {
        interests: interests.trim(),
        skills: skills.trim(),
        department: department || undefined,
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
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm text-center text-slate-100">
        <h1 className="text-xl font-semibold text-white">Your Research Profile</h1>
        <p className="mt-1 text-sm text-slate-300">Add interests and skills to find matching UC Davis professors.</p>
        <form onSubmit={onSubmit} className="mt-5 grid gap-5 justify-items-center">
          <div className="w-full max-w-md">
            <label className="block text-sm font-medium text-slate-200">Department</label>
            <select
              className="mt-1 w-full rounded-lg border border-white/20 px-3 py-2 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
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
            <label className="block text-sm font-medium text-slate-200">Interests</label>
            <input
              className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
              value={interests}
              onChange={e => setInterests(e.target.value)}
              placeholder="machine learning, systems, NLP"
            />
            <p className="mt-1 text-xs text-slate-400">Comma separated</p>
          </div>
          <div className="w-full max-w-md">
            <label className="block text-sm font-medium text-slate-200">Skills</label>
            <input
              className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
              value={skills}
              onChange={e => setSkills(e.target.value)}
              placeholder="python, pytorch, rust"
            />
            <p className="mt-1 text-xs text-slate-400">Comma separated</p>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-center w-full">
            <button
              type="submit"
              className="rounded-lg bg-[#1e3a8a] px-5 py-2.5 text-white shadow hover:bg-[#2544a0] disabled:opacity-60"
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


