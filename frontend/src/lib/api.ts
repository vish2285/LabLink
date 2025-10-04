import type { Professor, StudentProfile, MatchResult } from '../types'

// Normalize optional API base to avoid double slashes when joining paths
const RAW_BASE = (import.meta as any).env?.VITE_API_BASE ? String((import.meta as any).env.VITE_API_BASE) : ''
const API_BASE = RAW_BASE ? RAW_BASE.replace(/\/+$/, '') : ''
// Use direct backend URL if no API_BASE is set
const BASE_URL = API_BASE || 'http://127.0.0.1:8000'

async function getAuthToken(): Promise<string | null> {
  try {
    const token = window.localStorage.getItem('google_id_token')
    return token || null
  } catch (_) {
    return null
  }
}

async function authorizedFetch(input: RequestInfo, init: RequestInit = {}) {
  const token = await getAuthToken()
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string> | undefined),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  // Normalize accidental double slashes in path
  let req: RequestInfo = input
  if (typeof input === 'string' && input.startsWith('//')) {
    req = input.replace(/^\/\/+/, '/')
  }
  let res = await fetch(req, { ...init, headers })
  if (res.status === 401) {
    // Try prompting Google for a fresh token once
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any
      // Ensure GIS is initialized with a callback that updates localStorage
      const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID as string | undefined
      if (clientId && w.google?.accounts?.id) {
        try {
          w.google.accounts.id.initialize({
            client_id: clientId,
            callback: (resp: any) => {
              const cred = resp?.credential
              if (cred) {
                try {
                  window.localStorage.setItem('google_id_token', cred)
                  window.postMessage({ type: 'google-auth', idToken: cred }, '*')
                } catch {}
              }
            }
          })
        } catch {}
      }
      await new Promise<void>((resolve) => {
        w.google?.accounts?.id?.prompt?.(() => resolve())
      })
      const t2 = await getAuthToken()
      const headers2: Record<string, string> = {
        ...(init.headers as Record<string, string> | undefined),
      }
      if (t2) headers2['Authorization'] = `Bearer ${t2}`
      res = await fetch(req, { ...init, headers: headers2 })
    } catch {}
    // If still unauthorized, clear token and redirect to sign-in preserving return path
    if (res.status === 401) {
      try {
        window.localStorage.removeItem('google_id_token')
        window.localStorage.removeItem('google_user')
      } catch {}
      const here = typeof window !== 'undefined' ? window.location.pathname : '/'
      if (here !== '/sign-in') {
        const params = new URLSearchParams({ from: here })
        window.location.assign(`/sign-in?${params.toString()}`)
      }
    }
  }
  return res
}

export async function fetchProfessors(): Promise<Professor[]> {
  const res = await authorizedFetch(`${BASE_URL}/api/professors`)
  if (!res.ok) throw new Error('Failed to load professors')
  return res.json()
}

export async function fetchDepartments(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/api/departments`, { credentials: 'omit' })
  if (!res.ok) throw new Error('Failed to load departments')
  return res.json()
}

export async function fetchProfessor(id: number): Promise<Professor> {
  const res = await authorizedFetch(`${BASE_URL}/api/professors/${id}`)
  if (!res.ok) throw new Error('Failed to load professor')
  return res.json()
}

export async function matchProfessors(profile: StudentProfile, department?: string): Promise<MatchResult[]> {
  const query = department ? `?department=${encodeURIComponent(department)}` : ''
  const res = await authorizedFetch(`${BASE_URL}/api/match${query}`, {
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
  const res = await authorizedFetch(`${BASE_URL}/api/email/generate`, {
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
  const res = await authorizedFetch(`${BASE_URL}/api/email/send`, {
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
