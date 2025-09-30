import { useState } from 'react'
import { motion } from 'framer-motion'
import CursorGrid from '../components/CursorGrid'
import Button from '../components/Button'
import { FiUserPlus, FiSearch, FiMail } from 'react-icons/fi'

export default function Landing() {
  const [open, setOpen] = useState(false)

  return (
    <section className="relative overflow-hidden">
      <CursorGrid />
      <div className="relative mx-auto max-w-screen-xl gap-12 px-4 pt-20 pb-24 sm:pt-24 sm:pb-28 md:pt-28 md:pb-32 text-slate-300 md:px-8">
        <div className="mx-auto max-w-4xl space-y-5 text-center">
          <span className="inline-block rounded-full border border-white/20 px-4 py-1 text-xs tracking-wide text-slate-300">Built for Aggies</span>
          <h1 className="mx-auto text-4xl sm:text-5xl md:text-7xl font-extrabold text-white leading-tight">
            Find professors aligned with your research focus via
            <span className="bg-gradient-to-r from-[#7cc4ff] to-[#FFBF00] bg-clip-text text-transparent"> LabLink</span>
          </h1>
          <p className="mx-auto max-w-2xl text-slate-300/90 text-lg">
            Tell us your interests and skills. LabLink surfaces matching faculty and drafts your first outreach email.
          </p>
          <div className="mx-auto max-w-md rounded-md border border-white/20 bg-white/5 px-4 py-2 text-sm text-slate-300">
            We’re actively adding more departments. Check back for expanded coverage.
          </div>
          <div className="items-center justify-center gap-x-3 space-y-3 sm:flex sm:space-y-0">
            <Button asChild>
              <a href="/profile">Create your profile</a>
            </Button>
            <Button variant="ghost" onClick={() => setOpen(true)}>How it works</Button>
          </div>
        </div>
        <motion.div
          className="mx-auto mt-32 max-w-5xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="grid gap-6 md:grid-cols-3">
            <motion.div
              className="rounded-xl border border-white/10 bg-white/5 p-6 text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.45 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3a8a] text-white">
                <FiUserPlus className="h-5 w-5" />
              </div>
              <h3 className="text-white font-semibold mb-1">Create your profile</h3>
              <p className="text-slate-300 text-sm">Add your interests, skills, and optionally a department to personalize matches.</p>
            </motion.div>
            <motion.div
              className="rounded-xl border border-white/10 bg-white/5 p-6 text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3a8a] text-white">
                <FiSearch className="h-5 w-5" />
              </div>
              <h3 className="text-white font-semibold mb-1">See top matches</h3>
              <p className="text-slate-300 text-sm">We analyze interests, skills, and publications to surface aligned professors.</p>
            </motion.div>
            <motion.div
              className="rounded-xl border border-white/10 bg-white/5 p-6 text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.45 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3a8a] text-white">
                <FiMail className="h-5 w-5" />
              </div>
              <h3 className="text-white font-semibold mb-1">Draft and send</h3>
              <p className="text-slate-300 text-sm">Open the email editor to generate a tailored outreach email and send it.</p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {open && (
        <div className="fixed inset-0 z-30 flex h-full w-full items-center justify-center">
          <div className="absolute inset-0 h-full w-full bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative px-4">
            <button
              className="mb-4 h-10 w-10 rounded-full bg-gray-800 text-white duration-150 hover:bg-gray-700"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="m-auto h-5 w-5">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
            <video className="h-auto w-full max-w-2xl rounded-lg" controls autoPlay>
              <source src="https://raw.githubusercontent.com/sidiDev/remote-assets/main/FloatUI.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      )}
    </section>
  )
}


