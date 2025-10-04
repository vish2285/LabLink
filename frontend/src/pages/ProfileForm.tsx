import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Button from '../components/Button'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { matchProfessors, fetchDepartments } from '../lib/api'
import LoadingSpinner from '../components/LoadingSpinner'
import SkeletonLoader from '../components/SkeletonLoader'

export default function ProfileForm() {
  const navigate = useNavigate()
  const { setProfile, setResults, profile, departments, setDepartments } = useApp()
  // --- Tag input state (interests & skills) ---
  const seedInterests = (profile?.interests || '')
    .split(',').map(s => s.trim()).filter(Boolean)
  const seedSkills = (profile?.skills || '')
    .split(',').map(s => s.trim()).filter(Boolean)
  const [interestsList, setInterestsList] = useState<string[]>(seedInterests)
  const [skillsList, setSkillsList] = useState<string[]>(seedSkills)
  const [interestInput, setInterestInput] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [department, setDepartment] = useState(profile?.department || '')
  const [loading, setLoading] = useState(false)
  const [loadingDepartments, setLoadingDepartments] = useState(!departments.length)
  const [error, setError] = useState<string | null>(null)
  const INTEREST_EXAMPLES = ['machine learning', 'natural language processing', 'computer vision', 'distributed systems']
  const SKILL_EXAMPLES = ['python', 'pytorch', 'sql', 'c++', 'c']
  const [interestIdx, setInterestIdx] = useState(0)
  const [skillIdx, setSkillIdx] = useState(0)

  useEffect(() => {
    // Load any saved draft from localStorage (persists across sign out)
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem('app_profile') : null
      if (raw) {
        const saved = JSON.parse(raw) as { interests?: string; skills?: string; department?: string }
        if (saved?.interests) setInterestsList(saved.interests.split(',').map(s => s.trim()).filter(Boolean))
        if (saved?.skills) setSkillsList(saved.skills.split(',').map(s => s.trim()).filter(Boolean))
        if (saved?.department) setDepartment(saved.department)
      }
    } catch {}

    async function loadDepartments() {
      // Only load if we don't already have departments
      if (departments.length === 0) {
        // Add a simple guard to prevent multiple simultaneous calls
        if (window.__profileFormLoadingDepartments) return
        window.__profileFormLoadingDepartments = true
        
        try {
          setLoadingDepartments(true)
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
        } finally {
          setLoadingDepartments(false)
          window.__profileFormLoadingDepartments = false
        }
      } else {
        setLoadingDepartments(false)
      }
    }
    loadDepartments()
  }, []) // Remove departments from dependency array to prevent infinite loop

  // Separate useEffect for department alignment
  useEffect(() => {
    if (profile?.department && departments.length > 0) {
      setDepartment(departments.includes(profile.department) ? profile.department : '')
    }
  }, [profile?.department, departments])

  // Autosave draft to localStorage whenever fields change (no submit required)
  useEffect(() => {
    try {
      const draft = {
        interests: interestsList.join(', '),
        skills: skillsList.join(', '),
        department: department || ''
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('app_profile', JSON.stringify(draft))
      }
    } catch {}
  }, [interestsList, skillsList, department])

  // Cycle animated example hints while fields are empty
  useEffect(() => {
    const t = window.setInterval(() => {
      setInterestIdx(i => (i + 1) % INTEREST_EXAMPLES.length)
      setSkillIdx(i => (i + 1) % SKILL_EXAMPLES.length)
    }, 2000)
    return () => window.clearInterval(t)
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Client-side guard for empty inputs
      if (interestsList.length === 0 && skillsList.length === 0) {
        setLoading(false)
        setError('Enter skills/interests.')
        return
      }
      const payload = {
        interests: interestsList.join(', '),
        skills: skillsList.join(', '),
        department: department || undefined,
      }
      setProfile(payload)
      const results = await matchProfessors(payload, department || undefined)
      setResults(results)
      navigate('/matches')
    } catch (err: any) {
      const msg = String(err?.message || '')
      if (msg.includes('Provide at least interests or skills')) setError('Enter skills/interests')
      else if (!msg || msg === 'Failed to match') setError('Something went wrong. Try again.')
      else setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8" id="profile">
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4 sm:p-6 shadow-sm text-center text-slate-900 dark:text-slate-100">
        <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Your Research Profile</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Add interests and skills to find matching UC Davis professors.</p>
        <form onSubmit={onSubmit} className="mt-5 grid gap-4 sm:gap-5 justify-items-center">
          <div className="w-full max-w-md">
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">Department</label>
            {loadingDepartments ? (
              <div className="mt-1">
                <SkeletonLoader lines={1} height="h-10" />
              </div>
            ) : (
              <select
                className="mt-1 w-full rounded-lg border border-slate-300/60 dark:border-white/20 px-3 py-2 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
                value={department}
                onChange={e => setDepartment(e.target.value)}
              >
                <option value="" disabled>Select a department</option>
                {departments.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            )}
          </div>
          <div className="w-full max-w-md">
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">Interests</label>
            {interestsList.length === 0 && (
              <div className="mt-1 h-5 overflow-hidden text-xs text-slate-500 dark:text-slate-400">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={INTEREST_EXAMPLES[interestIdx]} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.3 }}>
                    e.g., {INTEREST_EXAMPLES[interestIdx]}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}
            <div className="mt-1 w-full rounded-lg border border-slate-300/60 dark:border-white/20 bg-white dark:bg-slate-900 px-2 py-2">
              <div className="flex flex-wrap gap-2">
                {interestsList.map((t, i) => (
                  <span key={`${t}-${i}`} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300/60 dark:bg-white/10 dark:text-slate-200 dark:border-white/10">
                    {t}
                    <button type="button" aria-label="Remove interest" className="ml-1 text-slate-500 hover:text-slate-700 dark:text-slate-400" onClick={() => setInterestsList(interestsList.filter((_, idx) => idx !== i))}>×</button>
                  </span>
                ))}
                <input
                  className="flex-1 min-w-[10ch] bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 px-2 py-1"
                  value={interestInput}
                  placeholder={interestsList.length === 0 ? 'Type and press Enter' : ''}
                  onChange={e => setInterestInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      const v = interestInput.trim()
                      if (v && !interestsList.some(x => x.toLowerCase() === v.toLowerCase())) {
                        setInterestsList([...interestsList, v])
                        setInterestInput('')
                      }
                    } else if (e.key === 'Backspace' && !interestInput && interestsList.length) {
                      // quick remove last
                      setInterestsList(interestsList.slice(0, -1))
                    }
                  }}
                  onBlur={() => {
                    const v = interestInput.trim()
                    if (v && !interestsList.some(x => x.toLowerCase() === v.toLowerCase())) {
                      setInterestsList([...interestsList, v])
                      setInterestInput('')
                    }
                  }}
                />
              </div>
            </div>
            {interestsList.length === 0 && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Press Enter to add. Click × to remove.</p>
            )}
          </div>
          <div className="w-full max-w-md">
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">Skills</label>
            {skillsList.length === 0 && (
              <div className="mt-1 h-5 overflow-hidden text-xs text-slate-500 dark:text-slate-400">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={SKILL_EXAMPLES[skillIdx]} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.3 }}>
                    e.g., {SKILL_EXAMPLES[skillIdx]}
                  </motion.span>
                </AnimatePresence>
              </div>
            )}
            <div className="mt-1 w-full rounded-lg border border-slate-300/60 dark:border-white/20 bg-white dark:bg-slate-900 px-2 py-2">
              <div className="flex flex-wrap gap-2">
                {skillsList.map((t, i) => (
                  <span key={`${t}-${i}`} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300/60 dark:bg-white/10 dark:text-slate-200 dark:border-white/10">
                    {t}
                    <button type="button" aria-label="Remove skill" className="ml-1 text-slate-500 hover:text-slate-700 dark:text-slate-400" onClick={() => setSkillsList(skillsList.filter((_, idx) => idx !== i))}>×</button>
                  </span>
                ))}
                <input
                  className="flex-1 min-w-[10ch] bg-transparent outline-none text-sm text-slate-900 dark:text-slate-100 px-2 py-1"
                  value={skillInput}
                  placeholder={skillsList.length === 0 ? 'Type and press Enter' : ''}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      const v = skillInput.trim()
                      if (v && !skillsList.some(x => x.toLowerCase() === v.toLowerCase())) {
                        setSkillsList([...skillsList, v])
                        setSkillInput('')
                      }
                    } else if (e.key === 'Backspace' && !skillInput && skillsList.length) {
                      setSkillsList(skillsList.slice(0, -1))
                    }
                  }}
                  onBlur={() => {
                    const v = skillInput.trim()
                    if (v && !skillsList.some(x => x.toLowerCase() === v.toLowerCase())) {
                      setSkillsList([...skillsList, v])
                      setSkillInput('')
                    }
                  }}
                />
              </div>
            </div>
            {skillsList.length === 0 && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Press Enter to add. Click × to remove.</p>
            )}
          </div>
          {error && (
            <div className="w-full max-w-md">
              <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>
            </div>
          )}
          <div className="flex justify-center w-full">
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <LoadingSpinner size="sm" text="Matching…" />
              ) : (
                'Find Matches'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


