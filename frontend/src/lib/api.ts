import type { Professor, StudentProfile, MatchResult } from '../types'

export async function fetchProfessors(): Promise<Professor[]> {
  const res = await fetch('/api/professors')
  if (!res.ok) throw new Error('Failed to load professors')
  return res.json()
}

export async function matchProfessors(profile: StudentProfile): Promise<MatchResult[]> {
  const res = await fetch('/api/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  if (!res.ok) throw new Error('Failed to match')
  return res.json()
}


