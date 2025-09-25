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
  const query = department ? `?department=${encodeURIComponent(department)}` : ''
  const res = await fetch(`/api/match${query}`, {
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
  const res = await fetch('/api/email/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!res.ok) throw new Error('Failed to generate email')
  return res.json()
}

// Interact with our API
// import {useAuth} from "@clerk/clerk-react"

// export const useApi = () => {
//     const {getToken} = useAuth()

//     const makeRequest = async (endpoint, options = {}) => {
//         const token = await getToken()
//         const defaultOptions = {
//             headers: {
//                 "Content-Type": "application/json",
//                 "Authorization": `Bearer ${token}`
//             }
//         }

//         const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/${endpoint}`, {
//             ...defaultOptions,
//             ...options,
//         })

//         if (!response.ok) {
//             const errorData = await response.json().catch(() => null)
//             if (response.status === 429) {
//                 throw new Error("Daily quota exceeded")
//             }
//             throw new Error(errorData?.detail || "An error occurred")
//         }

//         return response.json()
//     }

//     return {makeRequest}
// }
