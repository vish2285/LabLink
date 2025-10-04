import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import type { MatchResult } from '../types'
import { useEffect, useState } from 'react'
import { matchProfessors } from '../lib/api'
import ProfessorCard from '../components/ProfessorCard'
import EmptyState from '../components/EmptyState'
import { ResultsSkeleton } from '../components/SkeletonLoader'

export default function Results() {
  const navigate = useNavigate()
  const { results, selectProfessor, setEmailDraft, profile, setResults } = useApp() as any
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function maybeFetch() {
      if (!results?.length && profile?.interests?.trim?.()) {
        try {
          setLoading(true)
          setError(null)
          const res = await matchProfessors(profile, profile?.department || undefined)
          setResults(res)
        } catch (e: any) {
          setError(e?.message || 'Failed to load matches')
        } finally {
          setLoading(false)
        }
      }
    }
    maybeFetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const page = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }
  const container = {
    hidden: { opacity: 1 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  }
  const item = {
    hidden: { opacity: 0, y: 24, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.25 } },
  }
  const itemHiddenUntil = (d: number) => ({
    hidden: { opacity: 0, y: 24, scale: 0.96 },
    show: { opacity: 1, y: 0, scale: 1, transition: { delay: d, duration: 0.25 } },
  })

  function handleSelect(index: number) {
    const prof = results[index]
    selectProfessor(prof)
    // Open EmailEditor with an empty body; user can generate from there
    setEmailDraft('')
    navigate('/email')
  }
  if (loading) {
    return <ResultsSkeleton />
  }
  if (error) {
    return (
      <div className="flex items-center justify-center py-16 min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }
  if (!results?.length) return <EmptyState />

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.div
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-6"
        variants={page}
        initial="hidden"
        animate="show"
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Top Matches</h1>
          <p className="text-sm sm:text-base text-slate-700/90 dark:text-slate-300/90 px-4">Discover UC Davis professors aligned with your interests and skills.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-sm text-slate-600 dark:text-slate-400">
            <Link to="/profile" className="hover:text-slate-900 dark:hover:text-white underline sm:no-underline">Edit Profile</Link>
            <span className="hidden sm:inline">•</span>
            <span>{results.length} matches found</span>
          </div>
        </div>
      </motion.div>

      {/* Results Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid gap-6 md:gap-8">
          {/* Top 3 Ranking */}
          {results.length > 0 && (
            <motion.div className="mb-10" variants={container} initial="hidden" animate="show">
              {/* Desktop: 3-up layout. Hidden on mobile to avoid duplicate top card. */}
              <div className="hidden md:grid gap-4 grid-cols-1 md:grid-cols-3 items-stretch">
                {/* Second on left (hidden until its time) */}
                <div className="hidden md:block">
                  {results[1] && (
                    <motion.div variants={itemHiddenUntil(0.2)} initial="hidden" animate="show">
                      <ProfessorCard professor={results[1]} onSelect={() => handleSelect(1)} rank={2} />
                    </motion.div>
                  )}
                </div>
                {/* First in center with brief glow */}
                <motion.div className="relative smooth" variants={item} transition={{ delay: 0.0, duration: 0.25 }}>
                  {/* glow */}
                  <motion.div
                    className="pointer-events-none absolute -inset-3 rounded-2xl"
                    initial={{ opacity: 0.45, scale: 0.98 }}
                    animate={{ opacity: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                      background:
                        'radial-gradient(60% 60% at 50% 50%, rgba(124,196,255,0.25), rgba(124,196,255,0) 60%)',
                      filter: 'blur(12px)'
                    }}
                  />
                  <ProfessorCard professor={results[0]} onSelect={() => handleSelect(0)} rank={1} />
                </motion.div>
                {/* Third on right (hidden until its time) */}
                <div className="hidden md:block">
                  {results[2] && (
                    <motion.div variants={itemHiddenUntil(0.4)} initial="hidden" animate="show">
                      <ProfessorCard professor={results[2]} onSelect={() => handleSelect(2)} rank={3} />
                    </motion.div>
                  )}
                </div>
              </div>
              {/* Mobile: stacked top 3 */}
              <div className="md:hidden grid gap-4">
                <motion.div className="relative" variants={item} transition={{ delay: 0.0, duration: 0.25 }}>
                  <motion.div
                    className="pointer-events-none absolute -inset-3 rounded-2xl"
                    initial={{ opacity: 0.45, scale: 0.98 }}
                    animate={{ opacity: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    style={{
                      background:
                        'radial-gradient(60% 60% at 50% 50%, rgba(124,196,255,0.25), rgba(124,196,255,0) 60%)',
                      filter: 'blur(12px)'
                    }}
                  />
                  <ProfessorCard professor={results[0]} onSelect={() => handleSelect(0)} rank={1} />
                </motion.div>
                {results[1] && (
                  <motion.div variants={item} transition={{ delay: 0.2, duration: 0.25 }}>
                    <ProfessorCard professor={results[1]} onSelect={() => handleSelect(1)} rank={2} />
                  </motion.div>
                )}
                {results[2] && (
                  <motion.div variants={item} transition={{ delay: 0.4, duration: 0.25 }}>
                    <ProfessorCard professor={results[2]} onSelect={() => handleSelect(2)} rank={3} />
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* Other Matches */}
          {results.length > 3 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-slate-300/60 dark:bg-white/10" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">More Matches</span>
                <div className="h-px flex-1 bg-slate-300/60 dark:bg-white/10" />
              </div>
              <AnimatePresence mode="sync">
                <motion.div
                  className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  variants={container}
                  initial="hidden"
                  animate="show"
                >
                  {results.slice(3).map((professor: MatchResult, index: number) => (
                    <motion.div key={index + 3} variants={item}>
                      <ProfessorCard
                        professor={professor}
                        onSelect={() => handleSelect(index + 3)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


