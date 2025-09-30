import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import type { Professor, StudentProfile, MatchResult } from '../types'

type AppState = {
  profile: StudentProfile | null
  results: MatchResult[]
  selectedProfessor: Professor | null
  emailDraft: string
}

type AppActions = {
  setProfile: (profile: StudentProfile | null) => void
  setResults: (results: MatchResult[]) => void
  selectProfessor: (professor: Professor | null) => void
  setEmailDraft: (draft: string) => void
}

type AppContextValue = AppState & AppActions

const AppContext = createContext<AppContextValue | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<StudentProfile | null>(null)
  const [results, setResults] = useState<MatchResult[]>([])
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null)
  const [emailDraft, setEmailDraft] = useState<string>('')

  const value = useMemo<AppContextValue>(
    () => ({
      profile,
      results,
      selectedProfessor,
      emailDraft,
      setProfile,
      setResults,
      selectProfessor: setSelectedProfessor,
      setEmailDraft,
    }),
    [profile, results, selectedProfessor, emailDraft]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}


