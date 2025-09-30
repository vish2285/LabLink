import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMail, FiPaperclip, FiExternalLink, FiArrowLeft } from 'react-icons/fi'
import Button from '../components/Button'
import { useState as useReactState } from 'react'
import { useApp } from '../context/AppContext'
import { generateEmail } from '../lib/api'

export default function EmailEditor() {
  const { selectedProfessor, emailDraft, setEmailDraft, profile } = useApp()
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useReactState<File | null>(null)
  
  console.log('EmailEditor - selectedProfessor:', selectedProfessor)
  console.log('EmailEditor - emailDraft:', emailDraft)
  console.log('EmailEditor - profile:', profile)
  
  const subject = useMemo(
    () => generatedEmail?.subject || (selectedProfessor ? `Prospective research with ${selectedProfessor.name}` : 'Prospective research inquiry'),
    [selectedProfessor, generatedEmail]
  )
  
  const body = useMemo(
    () => generatedEmail?.body || emailDraft,
    [generatedEmail, emailDraft]
  )

  async function handleGenerateEmail() {
    if (!selectedProfessor || !profile) return
    
    setLoading(true)
    try {
      const email = await generateEmail({
        student_name: profile.name || 'Student',
        student_skills: profile.skills || '',
        availability: profile.availability || 'this semester',
        professor_name: selectedProfessor.name,
        professor_email: selectedProfessor.email || '',
        topic: profile.interests || '',
      })
      setGeneratedEmail(email)
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
        <Link to="/results" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white">
          <FiArrowLeft className="h-4 w-4" />
          Back to Results
        </Link>
      </div>
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-white/10 bg-white/5 p-6 shadow-sm text-slate-100">
        {!selectedProfessor && (
          <p className="text-sm text-slate-300">No professor selected. <Link to="/results" className="text-[#7cc4ff] underline">Go to results</Link></p>
        )}
        <div className="grid gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-200">Subject</label>
            <input className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" value={subject} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200">Body</label>
            <textarea
              className="mt-1 h-[18rem] sm:h-[24rem] w-full rounded-lg border border-white/20 bg-slate-900 text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
              value={body}
              onChange={e => setEmailDraft(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleGenerateEmail} disabled={loading}>
              <FiMail className="h-4 w-4 mr-2" />
              {loading ? 'Generating…' : 'Generate Email'}
            </Button>
            <label className="inline-flex items-center gap-2 h-10 whitespace-nowrap rounded-md border border-white/20 bg-white/5 px-4 text-sm text-slate-200 cursor-pointer hover:bg-white/10 transition">
              <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              <FiPaperclip className="h-4 w-4" />
              <span className="truncate max-w-[12rem]">{file ? file.name : 'Attach CV/Resume'}</span>
            </label>
            <Button onClick={async () => {
                if (!selectedProfessor) return
                const subjectText = subject
                const bodyText = body
                let payload: any = { to: selectedProfessor.email || '', subject: subjectText, body: bodyText }
                if (file) {
                  const arr = await file.arrayBuffer()
                  const b64 = btoa(String.fromCharCode(...new Uint8Array(arr)))
                  payload.filename = file.name
                  payload.file_b64 = b64
                }
                await fetch('/api/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                alert('Email sent')
              }}>
              <FiMail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
            <a
              className="inline-flex items-center gap-2 h-10 whitespace-nowrap rounded-md border border-white/20 bg-white/5 px-4 text-sm text-slate-200 hover:bg-white/10 transition"
              href={
                `mailto:${selectedProfessor?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
              }
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


