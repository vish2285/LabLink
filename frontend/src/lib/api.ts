import type { Professor, StudentProfile, MatchResult } from '../types'

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
  let res = await fetch(input, { ...init, headers })
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
      res = await fetch(input, { ...init, headers: headers2 })
    } catch {}
  }
  return res
}

export async function fetchProfessors(): Promise<Professor[]> {
  const res = await authorizedFetch('/api/professors')
  if (!res.ok) throw new Error('Failed to load professors')
  return res.json()
}

export async function fetchDepartments(): Promise<string[]> {
  const res = await authorizedFetch('/api/departments')
  if (!res.ok) throw new Error('Failed to load departments')
  return res.json()
}

export async function fetchProfessor(id: number): Promise<Professor> {
  const res = await authorizedFetch(`/api/professors/${id}`)
  if (!res.ok) throw new Error('Failed to load professor')
  return res.json()
}

export async function matchProfessors(profile: StudentProfile, department?: string): Promise<MatchResult[]> {
  const query = department ? `?department=${encodeURIComponent(department)}` : ''
  const res = await authorizedFetch(`/api/match${query}`, {
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
  const res = await authorizedFetch('/api/email/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error('Failed to generate email')
  return res.json()
}
