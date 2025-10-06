import type { Professor, StudentProfile, MatchResult } from '../types'

// Normalize optional API base to avoid double slashes when joining paths
const RAW_BASE = (import.meta as any).env?.VITE_API_BASE ? String((import.meta as any).env.VITE_API_BASE) : ''
export const API_BASE = RAW_BASE ? RAW_BASE.replace(/\/+$/, '') : ''

// Try to obtain a fresh Google ID token via One Tap prompt
async function getFreshGoogleIdToken(): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w: any = window as any
    if (!w.google?.accounts?.id?.prompt) return null
    return await new Promise<string | null>((resolve) => {
      let resolved = false
      const done = (val: string | null) => { if (!resolved) { resolved = true; resolve(val) } }
      const onMessage = (e: MessageEvent) => {
        try {
          const d = e?.data as any
          if (d && d.type === 'google-auth' && d.idToken) {
            done(String(d.idToken))
          }
        } catch { /* ignore */ }
      }
      window.addEventListener('message', onMessage)
      // Show prompt; GIS will postMessage via our existing AuthContext handler
      try { w.google.accounts.id.prompt(() => {}) } catch { /* ignore */ }
      // Timeout after 6 seconds
      setTimeout(() => { window.removeEventListener('message', onMessage); done(null) }, 6000)
    })
  } catch { return null }
}

async function authorizedFetch(input: RequestInfo, init: RequestInit = {}, _retry = true) {
  const token = (() => { try { return window.localStorage.getItem('google_id_token') } catch { return null } })()
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  // Normalize accidental double slashes in path
  let req: RequestInfo = input
  if (typeof input === 'string' && input.startsWith('//')) {
    req = input.replace(/^\/\/+/, '/')
  }
  const res = await fetch(req, { ...init, headers, credentials: 'include' })
  if (res.status === 401 && token && _retry) {
    try {
      // Refresh cookie session using saved Google ID token, then retry once
      await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id_token: token }),
      })
      return await authorizedFetch(req, init, false)
    } catch {
      // fall through
    }
    // Saved token likely expired; try to obtain a fresh one via GIS prompt
    try {
      const fresh = await getFreshGoogleIdToken()
      if (fresh) {
        try { window.localStorage.setItem('google_id_token', fresh) } catch { /* ignore */ }
        await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id_token: fresh }),
        })
        return await authorizedFetch(req, init, false)
      }
    } catch { /* ignore */ }
  }
  return res
}

export async function fetchProfessors(): Promise<Professor[]> {
  const res = await authorizedFetch(`${API_BASE}/api/professors`)
  if (!res.ok) throw new Error('Failed to load professors')
  return res.json()
}

export async function fetchDepartments(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/departments`, { credentials: 'omit' })
  if (!res.ok) throw new Error('Failed to load departments')
  return res.json()
}

export async function fetchProfessor(id: number): Promise<Professor> {
  const res = await authorizedFetch(`${API_BASE}/api/professors/${id}`)
  if (!res.ok) throw new Error('Failed to load professor')
  return res.json()
}

export async function matchProfessors(profile: StudentProfile, department?: string): Promise<MatchResult[]> {
  const query = department ? `?department=${encodeURIComponent(department)}` : ''
  const res = await authorizedFetch(`${API_BASE}/api/match${query}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  if (!res.ok) throw new Error('Failed to match')
  const data = await res.json()
  
  if (data && Array.isArray(data.matches)) {
    return data.matches.map((m: any) => ({
      ...m.professor,
      score: m.score,
      score_percent: m.score_percent,
      why: m.why,
    })) as MatchResult[]
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
  if (!res.ok) throw new Error('Failed to generate email')
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
