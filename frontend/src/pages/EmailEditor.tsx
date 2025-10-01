import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMail, FiPaperclip, FiExternalLink, FiArrowLeft } from 'react-icons/fi'
import Button from '../components/Button'
import { useState as useReactState } from 'react'
import { useApp } from '../context/AppContext'
import { generateEmail } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

export default function EmailEditor() {
  const { selectedProfessor, emailDraft, setEmailDraft, profile, emailSubject, setEmailSubject } = useApp() as any
  const { user } = useAuth()
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useReactState<File | null>(null)
  const [subjectText, setSubjectText] = useState<string>(emailSubject || '')
  
  console.log('EmailEditor - selectedProfessor:', selectedProfessor)
  console.log('EmailEditor - emailDraft:', emailDraft)
  console.log('EmailEditor - profile:', profile)
  
  const body = useMemo(
    () => generatedEmail?.body || emailDraft,
    [generatedEmail, emailDraft]
  )

  async function handleGenerateEmail() {
    if (!selectedProfessor || !profile) return
    
    setLoading(true)
    try {
      const studentName = (profile.name && profile.name.trim()) || user?.name || (user?.email ? user.email.split('@')[0] : 'UC Davis Student')
      const email = await generateEmail({
        student_name: studentName,
        student_skills: profile.skills || '',
        availability: profile.availability || 'this semester',
        professor_name: selectedProfessor.name,
        professor_email: selectedProfessor.email || '',
        topic: profile.interests || '',
      })
      setGeneratedEmail(email)
      const subj = email.subject || ''
      setSubjectText(subj)
      setEmailSubject(subj)
      setEmailDraft(email.body)
    } catch (error) {
      console.error('Failed to generate email:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto w-full max-w-3xl px-1">
        <Link to="/results" className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
          <FiArrowLeft className="h-4 w-4" />
          Back to Results
        </Link>
      </div>
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-6 shadow-sm text-slate-900 dark:text-slate-100">
        {!selectedProfessor && (
          <p className="text-sm text-slate-700 dark:text-slate-300">No professor selected. <Link to="/results" className="text-blue-700 dark:text-[#7cc4ff] underline">Go to results</Link></p>
        )}
        <div className="grid gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">Subject</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-300/60 dark:border-white/20 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
              value={subjectText}
              onChange={e => { setSubjectText(e.target.value); setEmailSubject(e.target.value) }}
              placeholder=""
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">Body</label>
            <textarea
              className="mt-1 h-[18rem] sm:h-[24rem] w-full rounded-lg border border-slate-300/60 dark:border-white/20 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
              value={body}
              onChange={e => setEmailDraft(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleGenerateEmail} disabled={loading}>
              <FiMail className="h-4 w-4 mr-2" />
              {loading ? 'Generating…' : 'Generate Email'}
            </Button>
            <label className="inline-flex items-center gap-2 h-10 whitespace-nowrap rounded-md border border-slate-300/60 dark:border-white/20 bg-white text-slate-900 dark:bg-white/5 dark:text-slate-200 px-4 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition">
              <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              <FiPaperclip className="h-4 w-4" />
              <span className="truncate max-w-[12rem]">{file ? file.name : 'Attach CV/Resume'}</span>
            </label>
            <Button onClick={async () => {
              if (!selectedProfessor) return
              const to = (selectedProfessor.email || '').trim()
              if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
                alert('Selected professor has no valid email address.')
                return
              }
              const w: any = window as any
              const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID as string | undefined
              if (!clientId || !w.google?.accounts?.oauth2?.initTokenClient) {
                alert('Google OAuth not available')
                return
              }
              const scope = 'https://www.googleapis.com/auth/gmail.send'
              const token: { access_token?: string } = {}
              const tokenClient = w.google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope,
                prompt: 'consent',
                callback: (resp: any) => { token.access_token = resp?.access_token }
              })
              await new Promise<void>((resolve) => {
                tokenClient.requestAccessToken({ prompt: 'consent' })
                const check = () => {
                  if (token.access_token) resolve()
                  else setTimeout(check, 200)
                }
                check()
              })
              const fromEmail = user?.email || ''
              const fromName = user?.name || 'UC Davis Student'
              const bodyText = body
              let mime = ''
              const subj = subjectText
              if (file) {
                const arr = await file.arrayBuffer()
                const b64file = btoa(String.fromCharCode(...new Uint8Array(arr)))
                const boundary = `lablink-${Math.random().toString(36).slice(2)}`
                const safeName = fromName.replace(/"/g, "'")
                const fileType = file.type || 'application/octet-stream'
                const fileName = file.name.replace(/"/g, '')
                mime = `From: "${safeName}" <${fromEmail}>\r\n`+
                       `To: ${to}\r\n`+
                       `Subject: ${subj}\r\n`+
                       `Reply-To: ${fromEmail}\r\n`+
                       `MIME-Version: 1.0\r\n`+
                       `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`+
                       `--${boundary}\r\n`+
                       `Content-Type: text/plain; charset="UTF-8"\r\n`+
                       `Content-Transfer-Encoding: 7bit\r\n\r\n`+
                       `${bodyText}\r\n\r\n`+
                       `--${boundary}\r\n`+
                       `Content-Type: ${fileType}; name="${fileName}"\r\n`+
                       `Content-Disposition: attachment; filename="${fileName}"\r\n`+
                       `Content-Transfer-Encoding: base64\r\n\r\n`+
                       `${b64file}\r\n`+
                       `--${boundary}--`
              } else {
                mime = `From: "${fromName.replace(/"/g, "'")}" <${fromEmail}>\r\nTo: ${to}\r\nSubject: ${subj}\r\nReply-To: ${fromEmail}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${bodyText}`
              }
              function toBase64Url(input: string): string {
                const utf8 = unescape(encodeURIComponent(input))
                const b64 = btoa(utf8)
                return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
              }
              try {
                const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
                  method: 'POST',
                  headers: { 'Authorization': `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ raw: toBase64Url(mime) })
                })
                if (!res.ok) {
                  const txt = await res.text().catch(() => '')
                  throw new Error(txt || 'Failed to send via Gmail')
                }
                alert('Email sent from your UC Davis account')
              } catch (e: any) {
                alert(e?.message || 'Failed to send via Gmail')
              }
            }}>
              <FiMail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <a
              className="inline-flex items-center gap-2 h-10 whitespace-nowrap rounded-md border border-slate-300/60 dark:border-white/20 bg-white text-slate-900 dark:bg-white/5 dark:text-slate-200 px-4 text-sm hover:bg-slate-100 dark:hover:bg-white/10 transition"
              href={`https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(selectedProfessor?.email || '')}&su=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(body)}${user?.email ? `&authuser=${encodeURIComponent(user.email)}` : ''}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FiExternalLink className="h-4 w-4" />
              Open in Mail
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}


