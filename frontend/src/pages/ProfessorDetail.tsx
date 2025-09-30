import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { fetchProfessor } from '../lib/api'
import type { Professor } from '../types'
import { useApp } from '../context/AppContext'
import Avatar from '../components/Avatar'
import { TagList } from '../components/Tag'

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
    const draft = `Hello Professor ${professor.name},\n\n` +
      `I'm a student interested in ${professor.research_interests || 'your research areas'}. ` +
      `I'd love to learn more about opportunities to contribute to your lab.\n\n` +
      `Best,\n[Your Name]`
    setEmailDraft(draft)
    navigate('/email')
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
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6">
        <nav className="text-sm text-gray-500">
          <Link to="/results" className="hover:text-blue-700">Results</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">{professor.name}</span>
        </nav>
      </div>

      <header className="mb-6">
        <div className="flex items-center gap-4 mb-3">
          <Avatar name={professor.name} photoUrl={professor.photo_url} />
          <h1 className="text-3xl font-bold text-gray-900">{professor.name}</h1>
        </div>
        {professor.department && (
          <p className="text-gray-600 mt-1">{professor.department}</p>
        )}
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {professor.research_interests && (
            <div className="rounded-xl border bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Research Interests</h2>
              <p className="text-gray-700 leading-relaxed">{professor.research_interests}</p>
            </div>
          )}

          {professor.skills?.length ? (
            <div className="rounded-xl border bg-white p-5">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Skills</h2>
              <TagList items={professor.skills} max={24} />
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border bg-white p-5">
            <h3 className="mb-3 text-base font-semibold text-gray-900">Profile</h3>
            <div className="space-y-2 text-sm text-gray-700">
              {professor.email && (
                <div className="flex items-center justify-between">
                  <span>Email</span>
                  <a href={`mailto:${professor.email}`} className="text-blue-700 hover:underline">{professor.email}</a>
                </div>
              )}
              {professor.profile_link && (
                <div className="flex items-center justify-between">
                  <span>Website</span>
                  <a href={professor.profile_link} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">Open</a>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {professor.profile_link ? (
                <a
                  href={professor.profile_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                >
                  View Site
                </a>
              ) : (
                <button className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-semibold opacity-60 cursor-not-allowed">
                  View Site
                </button>
              )}
              <button
                onClick={handleConnect}
                className="inline-flex items-center justify-center rounded-lg bg-[#002855] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Connect
              </button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
