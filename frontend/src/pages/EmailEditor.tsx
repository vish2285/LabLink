import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { generateEmail } from '../lib/api'

export default function EmailEditor() {
  const { selectedProfessor, emailDraft, setEmailDraft, profile } = useApp()
  const [generatedEmail, setGeneratedEmail] = useState<{ subject: string; body: string } | null>(null)
  const [loading, setLoading] = useState(false)
  
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
              className="mt-1 h-[24rem] w-full rounded-lg border border-white/20 bg-slate-900 text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]"
              value={body}
              onChange={e => setEmailDraft(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button
              className="rounded-lg bg-green-600 px-4 py-2 text-white shadow hover:bg-green-700 disabled:opacity-60"
              onClick={handleGenerateEmail}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Email'}
            </button>
            <a
              className="rounded-lg bg-[#1e3a8a] px-4 py-2 text-white shadow hover:bg-[#2544a0]"
              href={
                `mailto:${selectedProfessor?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
              }
            >
              Open in Mail
            </a>
            <Link className="rounded-lg border border-white/20 px-4 py-2 shadow-sm hover:bg-white/10" to="/results">Back to Results</Link>
          </div>
        </div>
      </div>
    </div>
  )
}


