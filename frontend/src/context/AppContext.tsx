import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import type { Professor, StudentProfile, MatchResult } from '../types'

type AppState = {
  profile: StudentProfile | null
  results: MatchResult[]
  selectedProfessor: Professor | null
  emailDraft: string
  theme: 'light' | 'dark'
}

type AppActions = {
  setProfile: (profile: StudentProfile | null) => void
  setResults: (results: MatchResult[]) => void
  selectProfessor: (professor: Professor | null) => void
  setEmailDraft: (draft: string) => void
  toggleTheme: () => void
  setTheme: (t: 'light' | 'dark') => void
}

type AppContextValue = AppState & AppActions

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [results, setResults] = useState<MatchResult[]>([])
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null)
  const [emailDraft, setEmailDraft] = useState<string>('')
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('theme') as 'light' | 'dark' | null) : null
    if (saved === 'light' || saved === 'dark') return saved
    // Prefer system
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
    return 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try { localStorage.setItem('theme', theme) } catch {}
  }, [theme])

  const value = useMemo<AppContextValue>(
    () => ({
      profile,
      results,
      selectedProfessor,
      emailDraft,
      theme,
      setProfile,
      setResults,
      selectProfessor: setSelectedProfessor,
      setEmailDraft,
      toggleTheme: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')),
      setTheme,
    }),
    [profile, results, selectedProfessor, emailDraft, theme]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}


