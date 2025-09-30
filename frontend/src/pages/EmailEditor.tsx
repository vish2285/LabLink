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
      <div className="mx-auto w-full max-w-3xl rounded-xl border bg-white p-6 shadow-sm">
        {!selectedProfessor && (
          <p className="text-sm text-gray-600">No professor selected. <Link to="/results" className="text-blue-600 underline">Go to results</Link></p>
        )}
        <div className="grid gap-5">
          <div>
            <label className="block text-sm font-medium">Subject</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" value={subject} readOnly />
          </div>
          <div>
            <label className="block text-sm font-medium">Body</label>
            <textarea
              className="mt-1 h-[24rem] w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={body}
              onChange={e => setEmailDraft(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <button
              className="rounded-lg bg-green-600 px-4 py-2 text-white shadow hover:opacity-90 disabled:opacity-60"
              onClick={handleGenerateEmail}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Email'}
            </button>
            <a
              className="rounded-lg bg-[#002855] px-4 py-2 text-white shadow hover:opacity-90"
              href={
                `mailto:${selectedProfessor?.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
              }
            >
              Open in Mail
            </a>
            <Link className="rounded-lg border px-4 py-2 shadow-sm" to="/results">Back to Results</Link>
          </div>
        </div>
      </div>
    </div>
  )
}


