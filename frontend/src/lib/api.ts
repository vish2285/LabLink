import type { Professor, StudentProfile, MatchResult } from '../types'

// Normalize optional API base to avoid double slashes when joining paths
const RAW_BASE = (import.meta as any).env?.VITE_API_BASE ? String((import.meta as any).env.VITE_API_BASE) : ''
export const API_BASE = RAW_BASE ? RAW_BASE.replace(/\/+$/, '') : ''

// Specific error to signal auth failures after retries
export class AuthError extends Error {
  constructor(message = 'Unauthorized') { super(message); this.name = 'AuthError' }
}

async function authorizedFetch(input: RequestInfo, init: RequestInit = {}) {
  // Normalize accidental double slashes in path
  let req: RequestInfo = input
  if (typeof input === 'string' && input.startsWith('//')) {
    req = input.replace(/^\/\/+/, '/')
  }
  const res = await fetch(req, { ...init, credentials: 'include' })
  if (res.status === 401) throw new AuthError('Unauthorized')
  return res
}

export async function fetchProfessors(): Promise<Professor[]> {
  const res = await authorizedFetch(`${API_BASE}/api/professors`)
  if (!res.ok) throw new Error(`Failed to load professors: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function fetchDepartments(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/departments`, { credentials: 'omit' })
  if (!res.ok) throw new Error(`Failed to load departments: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function fetchProfessor(id: number): Promise<Professor> {
  const res = await authorizedFetch(`${API_BASE}/api/professors/${id}`)
  if (!res.ok) throw new Error(`Failed to load professor ${id}: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function matchProfessors(profile: StudentProfile, department?: string): Promise<MatchResult[]> {
  const query = department ? `?department=${encodeURIComponent(department)}` : ''
  const res = await authorizedFetch(`${API_BASE}/api/match${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  if (!res.ok) throw new Error(`Failed to match: ${res.status} ${res.statusText}`)
  const data = await res.json()
  
  if (data && Array.isArray(data.matches)) {
    const out: MatchResult[] = []
    for (const m of data.matches) {
      if (m && m.professor) {
        out.push({
          ...(m.professor as Professor),
          score: m.score,
          score_percent: m.score_percent,
          why: m.why,
        } as MatchResult)
      }
    }
    return out
  }
  return []
}

export async function generateEmail(request: {
  student_name: string;
  student_skills?: string;
  availability?: string;
  professor_name: string;
  professor_email?: string;
  paper_title?: string;
  topic?: string;
}): Promise<{ subject: string; body: string }> {
  const res = await authorizedFetch(`${API_BASE}/api/email/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error(`Failed to generate email: ${res.status} ${res.statusText}`)
  return res.json()
}

export async function sendEmail(payload: {
  to: string;
  subject: string;
  body: string;
  filename?: string;
  file_b64?: string;
}): Promise<{ ok: true }> {
  const res = await authorizedFetch(`${API_BASE}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || 'Failed to send email')
  }
  return res.json()
}
