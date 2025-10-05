import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import type { Professor, StudentProfile, MatchResult } from '../types'

declare global {
  interface Window {
    __departmentsLoading?: boolean;
    __profileFormLoadingDepartments?: boolean;
  }
}

type AppState = {
  profile: StudentProfile | null
  results: MatchResult[]
  selectedProfessor: Professor | null
  emailDraft: string
  emailSubject: string
  theme: 'light' | 'dark'
  departments: string[]
}

type AppActions = {
  setProfile: (profile: StudentProfile | null) => void
  setResults: (results: MatchResult[]) => void
  selectProfessor: (professor: Professor | null) => void
  setEmailDraft: (draft: string) => void
  setEmailSubject: (subj: string) => void
  toggleTheme: () => void
  setTheme: (t: 'light' | 'dark') => void
  ensureDepartments: () => Promise<void>
  setDepartments: (departments: string[]) => void
}

type AppContextValue = AppState & AppActions

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const DEPTS_LS = 'departments_cache'
  const DEPTS_TS_LS = 'departments_cache_ts'
  const DEPTS_TTL_MS = 24 * 60 * 60 * 1000

  const [profile, setProfile] = useState<StudentProfile | null>(() => {
    try {
      if (typeof window === 'undefined') return null
      const raw = window.localStorage.getItem('app_profile')
      return raw ? (JSON.parse(raw) as StudentProfile) : null
    } catch { return null }
  })
  const [results, setResults] = useState<MatchResult[]>(() => {
    try {
      if (typeof window === 'undefined') return []
      const raw = window.localStorage.getItem('app_results')
      return raw ? (JSON.parse(raw) as MatchResult[]) : []
    } catch { return [] }
  })
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(() => {
    try {
      if (typeof window === 'undefined') return null
      const raw = window.localStorage.getItem('app_selected_professor')
      return raw ? (JSON.parse(raw) as Professor) : null
    } catch { return null }
  })
  const [emailDraft, setEmailDraft] = useState<string>(() => {
    try {
      if (typeof window === 'undefined') return ''
      return window.localStorage.getItem('app_email_draft') || ''
    } catch { return '' }
  })
  const [emailSubject, setEmailSubject] = useState<string>(() => {
    try {
      if (typeof window === 'undefined') return ''
      return window.localStorage.getItem('app_email_subject') || ''
    } catch { return '' }
  })
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('theme') as 'light' | 'dark' | null) : null
    if (saved === 'light' || saved === 'dark') return saved
    // Prefer system
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
    return 'light'
  })

  // Departments cached in-memory and persisted with TTL
  const [departments, setDepartments] = useState<string[]>(() => {
    try {
      if (typeof window === 'undefined') return []
      const raw = window.localStorage.getItem(DEPTS_LS)
      const ts = Number(window.localStorage.getItem(DEPTS_TS_LS) || 0)
      if (raw && (Date.now() - ts) < DEPTS_TTL_MS) {
        const deps = JSON.parse(raw) as string[]
        if (Array.isArray(deps) && deps.length) return deps
      }
    } catch {}
    return []
  })

  const ensureDepartments = async (): Promise<void> => {
    try {
      // Only fetch if we don't have departments or only have the default fallback
      if (departments && departments.length > 0 && departments[0] !== 'Computer Science') return
      
      // Add a simple guard to prevent multiple simultaneous calls
      if (window.__departmentsLoading) return
      window.__departmentsLoading = true
      
      const res = await fetch('/api/departments', { credentials: 'include' })
      if (res.ok) {
        const deps = await res.json()
        if (Array.isArray(deps) && deps.length) {
          setDepartments(deps)
          try {
            window.localStorage.setItem(DEPTS_LS, JSON.stringify(deps))
            window.localStorage.setItem(DEPTS_TS_LS, String(Date.now()))
          } catch {}
        }
      }
    } catch {}
    finally {
      window.__departmentsLoading = false
    }
  }

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    try { localStorage.setItem('theme', theme) } catch {}
  }, [theme])

  // Persist profile/results/email across sessions
  useEffect(() => {
    try { if (profile) window.localStorage.setItem('app_profile', JSON.stringify(profile)); else window.localStorage.removeItem('app_profile') } catch {}
  }, [profile])
  useEffect(() => {
    try { window.localStorage.setItem('app_results', JSON.stringify(results || [])) } catch {}
  }, [results])
  useEffect(() => {
    try { window.localStorage.setItem('app_email_draft', emailDraft || '') } catch {}
  }, [emailDraft])
  useEffect(() => {
    try { window.localStorage.setItem('app_email_subject', emailSubject || '') } catch {}
  }, [emailSubject])
  useEffect(() => {
    try {
      if (selectedProfessor) window.localStorage.setItem('app_selected_professor', JSON.stringify(selectedProfessor))
      else window.localStorage.removeItem('app_selected_professor')
    } catch {}
  }, [selectedProfessor])

  const value = useMemo<AppContextValue>(
    () => ({
      profile,
      results,
      selectedProfessor,
      emailDraft,
      emailSubject,
      theme,
      departments,
      setProfile,
      setResults,
      selectProfessor: setSelectedProfessor,
      setEmailDraft,
      setEmailSubject,
      toggleTheme: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')),
      setTheme,
      ensureDepartments,
      setDepartments,
    }),
    [profile, results, selectedProfessor, emailDraft, emailSubject, theme, departments]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}


