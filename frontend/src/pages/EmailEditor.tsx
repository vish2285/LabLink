import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMail, FiPaperclip, FiExternalLink, FiArrowLeft } from 'react-icons/fi'
import Button from '../components/Button'
import { useState as useReactState } from 'react'
import { useApp } from '../context/AppContext'
import { generateEmail, sendEmail } from '../lib/api'
import { useAuth } from '../auth/AuthContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function EmailEditor() {
  const { selectedProfessor, emailDraft, setEmailDraft, profile, emailSubject, setEmailSubject } = useApp() as any
  const { user } = useAuth()
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useReactState<File | null>(null)
  const [subjectText, setSubjectText] = useState<string>(emailSubject || '')
  
  // Remove verbose logs in production for privacy
  
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
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <Link to="/matches" className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
          <FiArrowLeft className="h-4 w-4" />
          Back to Matches
        </Link>
      </div>
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4 sm:p-6 shadow-sm text-slate-900 dark:text-slate-100">
        {!selectedProfessor && (
          <p className="text-sm text-slate-700 dark:text-slate-300">No professor selected. <Link to="/matches" className="text-blue-700 dark:text-[#7cc4ff] underline">Go to matches</Link></p>
        )}
        <div className="grid gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">To</label>
            <div className="mt-1 w-full rounded-lg border border-slate-300/60 dark:border-white/20 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 px-3 py-2">
              {selectedProfessor ? (
                <span>
                  {selectedProfessor.name}
                  {selectedProfessor.email ? (
                    <span className="text-slate-600 dark:text-slate-300"> {`<${selectedProfessor.email}>`}</span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400"> (no email listed)</span>
                  )}
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400">No professor selected</span>
              )}
            </div>
          </div>
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
              className="mt-1 h-[16rem] sm:h-[18rem] md:h-[24rem] w-full rounded-lg border border-slate-300/60 dark:border-white/20 bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] resize-none"
              value={body}
              onChange={e => setEmailDraft(e.target.value)}
              placeholder="Type your email message here..."
            />
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Button variant="secondary" onClick={handleGenerateEmail} disabled={loading} className="w-full sm:w-auto">
              {loading ? (
                <LoadingSpinner size="sm" text="Generating…" />
              ) : (
                <>
                  <FiMail className="h-4 w-4 mr-2" />
                  Generate Email
                </>
              )}
            </Button>
            <label className="inline-flex items-center gap-2 h-10 whitespace-nowrap rounded-md border border-slate-300/60 dark:border-white/20 bg-white text-slate-900 dark:bg-white/5 dark:text-slate-200 px-4 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 transition w-full sm:w-auto">
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
              try {
                let file_b64: string | undefined
                let filename: string | undefined
                if (file) {
                  const arr = await file.arrayBuffer()
                  // Base64 without data URL prefix
                  file_b64 = btoa(String.fromCharCode(...new Uint8Array(arr)))
                  filename = file.name
                }
                await sendEmail({ to, subject: subjectText, body, filename, file_b64 })
                try {
                  const el = document.createElement('div')
                  el.className = 'fixed top-4 right-4 z-50 rounded-md bg-emerald-600 text-white px-4 py-2 shadow-lg smooth'
                  el.textContent = 'Email sent!'
                  document.body.appendChild(el)
                  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300) }, 1500)
                } catch {}
              } catch (e: any) {
                alert(e?.message || 'Failed to send email')
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


