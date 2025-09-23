import type { Professor, StudentProfile, MatchResult } from '../types'

export async function fetchProfessors(): Promise<Professor[]> {
  const res = await fetch('/api/professors')
  if (!res.ok) throw new Error('Failed to load professors')
  return res.json()
}

export async function fetchDepartments(): Promise<string[]> {
  const res = await fetch('/api/departments')
  if (!res.ok) throw new Error('Failed to load departments')
  return res.json()
}

export async function matchProfessors(profile: StudentProfile, department?: string): Promise<MatchResult[]> {
  const interests = Array.isArray(profile.interests) ? profile.interests.join(', ') : (profile as any).interests
  const skills = Array.isArray(profile.skills) ? (profile.skills as string[]).join(', ') : (profile as any).skills
  const query = department ? `?department=${encodeURIComponent(department)}` : ''
  const res = await fetch(`/api/match${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interests, skills }),
  })
  if (!res.ok) throw new Error('Failed to match')
  const data = await res.json()
  // Support both old (array of professors) and new (object with matches) shapes
  if (Array.isArray(data)) return data as MatchResult[]
  if (data && Array.isArray(data.matches)) {
    return data.matches.map((m: any) => ({
      ...(m.professor || {}),
      score: typeof m.score_percent === 'number' ? m.score_percent / 100 : m.score,
    })) as MatchResult[]
  }
  return []
}


