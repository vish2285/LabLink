import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { fetchProfessor } from '../lib/api'
import type { Professor } from '../types'
import { useApp } from '../context/AppContext'
import Avatar from '../components/Avatar'
import { TagList } from '../components/Tag'
import { FiExternalLink, FiMail } from 'react-icons/fi'

export default function ProfessorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { selectProfessor, setEmailDraft } = useApp()
  const [professor, setProfessor] = useState<Professor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const p = await fetchProfessor(Number(id))
        if (active) setProfessor(p)
      } catch (e: any) {
        if (active) setError(e?.message || 'Failed to load professor')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [id])

  function handleConnect() {
    if (!professor) return
    selectProfessor(professor)
    // Open EmailEditor with an empty body; user can generate from there
    setEmailDraft('')
    navigate('/email')
  }

  // Publications removed, so link normalization helper is no longer needed

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">Loading…</div>
    )
  }

  if (error || !professor) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-red-600">{error || 'Professor not found'}</p>
        <Link to="/matches" className="text-blue-600 underline">Back to matches</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl p-6 text-slate-900 dark:text-slate-100">
      <div className="mb-6">
        <nav className="text-sm text-slate-600 dark:text-slate-400">
          <Link to="/matches" className="hover:text-slate-900 dark:hover:text-white">Matches</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800 dark:text-slate-300">{professor.name}</span>
        </nav>
      </div>

      <header className="mb-6 rounded-2xl p-[1px] bg-gradient-to-br from-indigo-500/20 to-sky-400/10 shadow-sm overflow-hidden">
        <div className="relative overflow-hidden rounded-2xl bg-white/85 dark:bg-slate-900/60 backdrop-blur border border-slate-200/60 dark:border-white/10 p-5 smooth h-full">
        <div className="pointer-events-none absolute -inset-1 opacity-60" style={{ background:
          'radial-gradient(600px 160px at 0% 0%, rgba(124,196,255,0.18), rgba(124,196,255,0) 40%), radial-gradient(600px 160px at 100% 0%, rgba(255,191,0,0.15), rgba(255,191,0,0) 40%)'
        }} />
        <div className="relative flex items-center gap-4">
          <div className="scale-110">
            <Avatar name={professor.name} photoUrl={professor.photo_url} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{professor.name}</h1>
            {professor.department && (
              <p className="text-slate-700 dark:text-slate-300 mt-1">{professor.department}</p>
            )}
          </div>
        </div>
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {professor.research_interests && (
            <div className="rounded-2xl p-[1px] bg-gradient-to-br from-indigo-500/20 to-sky-400/10 shadow-sm overflow-hidden">
              <div className="rounded-2xl bg-white/85 dark:bg-slate-900/60 backdrop-blur border border-slate-200/60 dark:border-white/10 p-5 h-full">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Research Interests</h2>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{professor.research_interests}</p>
              </div>
            </div>
          )}

          {professor.skills?.length ? (
            <div className="rounded-2xl p-[1px] bg-gradient-to-br from-indigo-500/20 to-sky-400/10 shadow-sm overflow-hidden">
              <div className="rounded-2xl bg-white/85 dark:bg-slate-900/60 backdrop-blur border border-slate-200/60 dark:border-white/10 p-5 h-full">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Skills</h2>
              <TagList items={professor.skills} max={24} />
              </div>
            </div>
          ) : null}

          {/* Publications removed */}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl p-[1px] bg-gradient-to-br from-indigo-500/20 to-sky-400/10 shadow-sm overflow-hidden">
            <div className="rounded-2xl bg-white/85 dark:bg-slate-900/60 backdrop-blur border border-slate-200/60 dark:border-white/10 p-5 h-full">
            <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Profile</h3>
            <div className="space-y-2 text-sm text-slate-800 dark:text-slate-200">
              {professor.email && (
                <div className="flex items-center justify-between">
                  <span>Email</span>
                  <a href={`mailto:${professor.email}`} className="text-blue-700 hover:underline dark:text-[#7cc4ff]">{professor.email}</a>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {professor.profile_link ? (
                <a
                  href={professor.profile_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300/70 dark:border-white/20 bg-white/80 dark:bg-white/5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  UC Davis
                  <FiExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <button className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300/70 dark:border-white/20 bg-white/40 dark:bg-white/5 px-3 py-2 text-xs font-medium text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed whitespace-nowrap">
                  UC Davis
                  <FiExternalLink className="h-3 w-3" />
                </button>
              )}
              {professor.personal_site ? (
                <a
                  href={professor.personal_site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300/70 dark:border-white/20 bg-white/80 dark:bg-white/5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors whitespace-nowrap"
                >
                  Website
                  <FiExternalLink className="h-3 w-3" />
                </a>
              ) : (
                <button className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-300/70 dark:border-white/20 bg-white/40 dark:bg-white/5 px-3 py-2 text-xs font-medium text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed whitespace-nowrap">
                  Website
                  <FiExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="mt-3">
              <button
                onClick={handleConnect}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 px-3 py-2 text-xs font-medium text-white hover:from-indigo-700 hover:to-blue-700 dark:hover:from-indigo-600 dark:hover:to-blue-600 shadow-sm transition-all"
              >
                <FiMail className="h-3.5 w-3.5" />
                Draft Email
              </button>
            </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
