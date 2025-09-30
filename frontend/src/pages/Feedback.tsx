import { useState } from 'react'
import Button from '../components/Button'

export default function Feedback() {
  const [text, setText] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    try {
      setError(null)
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: 'lablinkdavis@gmail.com', subject: 'LabLink feedback', body: `From: ${email || 'anonymous'}\n\n${text}` })
      })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new Error(t || `Send failed (${res.status})`)
      }
      setSent(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to send. Is email configured on the server?')
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-8 py-12 text-slate-200 text-center">
      <h1 className="text-3xl font-extrabold text-white mb-4">Feedback</h1>
      {sent ? (
        <p className="text-slate-300">Thanks! Your feedback was sent.</p>
      ) : (
        <form onSubmit={submit} className="mx-auto rounded-xl border border-white/10 bg-white/5 p-6 space-y-4 text-left">
          <div>
            <label className="block text-sm mb-1 text-slate-300">Email (optional)</label>
            <input className="w-full rounded-md border border-white/20 bg-slate-900 text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@ucdavis.edu" />
          </div>
          <div>
            <label className="block text-sm mb-1 text-slate-300">Your feedback</label>
            <textarea className="w-full h-40 rounded-md border border-white/20 bg-slate-900 text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]" value={text} onChange={e => setText(e.target.value)} placeholder="What's working well? What should we improve?" />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex justify-center">
            <Button type="submit">Send Feedback</Button>
          </div>
        </form>
      )}
    </div>
  )
}


