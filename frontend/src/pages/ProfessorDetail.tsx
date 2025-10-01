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

  function normalizePubLink(title?: string, raw?: string): string | undefined {
    const t = (raw || '').trim()
    const scholar = (q: string) => `https://scholar.google.com/scholar?q=${encodeURIComponent(q)}`
    if (!t) return title ? scholar(title) : undefined

    // DOI
    if (/^10\.\d{4,9}\/.+/i.test(t)) return `https://doi.org/${t}`
    const doiMatch = t.match(/^doi:\s*(10\.[^\s]+)/i)
    if (doiMatch) return `https://doi.org/${doiMatch[1]}`

    // arXiv
    const arx1 = t.match(/^arxiv:\s*(\d{4}\.\d{4,5}(v\d+)?)/i)
    if (arx1) return `https://arxiv.org/abs/${arx1[1]}`
    if (/^\d{4}\.\d{4,5}(v\d+)?$/i.test(t)) return `https://arxiv.org/abs/${t}`

    // Protocol-relative
    if (t.startsWith('//')) return `https:${t}`

    // Absolute URL
    try {
      const u = new URL(t)
      return u.toString()
    } catch {}

    // Root-relative path: resolve against professor site if available
    if (t.startsWith('/')) {
      const base = professor?.profile_link
      if (base) {
        try {
          const b = new URL(base)
          return `${b.origin}${t}`
        } catch {}
      }
      return title ? scholar(title) : undefined
    }

    // Try prefixing https:// and validate
    try {
      const u2 = new URL(`https://${t}`)
      return u2.toString()
    } catch {}

    // Fallback
    return scholar(title || t)
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl p-6">Loading…</div>
    )
  }

  if (error || !professor) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <p className="text-red-600">{error || 'Professor not found'}</p>
        <Link to="/results" className="text-blue-600 underline">Back to results</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl p-6 text-slate-900 dark:text-slate-100">
      <div className="mb-6">
        <nav className="text-sm text-slate-600 dark:text-slate-400">
          <Link to="/results" className="hover:text-slate-900 dark:hover:text-white">Results</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800 dark:text-slate-300">{professor.name}</span>
        </nav>
      </div>

      <header className="mb-6">
        <div className="flex items-center gap-4 mb-3">
          <Avatar name={professor.name} photoUrl={professor.photo_url} />
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{professor.name}</h1>
        </div>
        {professor.department && (
          <p className="text-slate-700 dark:text-slate-300 mt-1">{professor.department}</p>
        )}
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {professor.research_interests && (
            <div className="rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Research Interests</h2>
              <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{professor.research_interests}</p>
            </div>
          )}

          {professor.skills?.length ? (
            <div className="rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Skills</h2>
              <TagList items={professor.skills} max={24} />
            </div>
          ) : null}

          {professor.recent_publications?.length ? (
            <div className="rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5">
              <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Recent Publications</h2>
              <ul className="space-y-4">
                {professor.recent_publications.slice(0, 6).map((pub, i) => (
                  <li key={i} className="border-b border-slate-200/60 dark:border-white/10 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-baseline justify-between gap-3">
                      {normalizePubLink(pub.title, pub.link) ? (
                        <a href={normalizePubLink(pub.title, pub.link)} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-900 dark:text-white hover:underline">
                          {pub.title || 'Untitled'}
                        </a>
                      ) : (
                        <span className="font-medium text-slate-900 dark:text-white">{pub.title || 'Untitled'}</span>
                      )}
                      {typeof pub.year === 'number' && (
                        <span className="text-xs text-slate-600 dark:text-slate-400">{pub.year}</span>
                      )}
                    </div>
                    {pub.abstract && (
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 line-clamp-3">{pub.abstract}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-5">
            <h3 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Profile</h3>
            <div className="space-y-2 text-sm text-slate-800 dark:text-slate-200">
              {professor.email && (
                <div className="flex items-center justify-between">
                  <span>Email</span>
                  <a href={`mailto:${professor.email}`} className="text-blue-700 hover:underline dark:text-[#7cc4ff]">{professor.email}</a>
                </div>
              )}
              {professor.profile_link && (
                <div className="flex items-center justify-between">
                  <span>Website</span>
                  <a href={professor.profile_link} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline dark:text-[#7cc4ff]">Open</a>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {professor.profile_link ? (
                <a
                  href={professor.profile_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-slate-300/60 dark:border-white/20 px-3 py-1.5 text-xs font-medium hover:bg-slate-900/5 dark:hover:bg-white/10 whitespace-nowrap"
                >
                  View Site
                  <FiExternalLink className="ml-1 h-3 w-3 opacity-80" />
                </a>
              ) : (
                <button className="inline-flex items-center justify-center rounded-md border border-slate-300/60 dark:border-white/20 px-3 py-1.5 text-xs font-medium opacity-60 cursor-not-allowed whitespace-nowrap">
                  View Site
                  <FiExternalLink className="ml-1 h-3 w-3 opacity-60" />
                </button>
              )}
              <button
                onClick={handleConnect}
                className="inline-flex items-center justify-center rounded-md bg-[#1e3a8a] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2544a0] whitespace-nowrap"
              >
                <FiMail className="mr-1 h-3 w-3 text-white/90" />
                Draft Email
              </button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
