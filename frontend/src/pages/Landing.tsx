import { useRef } from 'react'
import { motion } from 'framer-motion'
import CursorGrid from '../components/CursorGrid'
import Button from '../components/Button'
import { FiUserPlus, FiSearch, FiMail } from 'react-icons/fi'

export default function Landing() {
  const howRef = useRef<HTMLDivElement | null>(null)

  return (
    <section className="relative overflow-hidden">
      <CursorGrid />
      <div className="relative mx-auto max-w-screen-xl gap-12 px-4 pt-20 pb-24 sm:pt-24 sm:pb-28 md:pt-28 md:pb-32 text-slate-700 dark:text-slate-300 md:px-8">
        <div className="mx-auto max-w-4xl space-y-5 text-center">
          <span className="inline-block rounded-full border border-slate-300/60 dark:border-white/20 px-4 py-1 text-xs tracking-wide text-slate-600 dark:text-slate-300">Built for Aggies</span>
          <h1 className="mx-auto text-4xl sm:text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white leading-tight">
            Find professors aligned with your research focus via
            <span className="bg-gradient-to-r from-[#1e3a8a] to-[#FFBF00] dark:from-[#7cc4ff] dark:to-[#FFBF00] bg-clip-text text-transparent"> LabLink</span>
          </h1>
          <p className="mx-auto max-w-2xl text-slate-700/90 dark:text-slate-300/90 text-lg">
            Tell us your interests and skills. LabLink surfaces matching faculty and drafts your first outreach email.
          </p>
          <div className="mx-auto max-w-md rounded-md border border-slate-300/60 dark:border-white/20 bg-white/70 dark:bg-white/5 px-4 py-2 text-sm text-slate-700 dark:text-slate-300">
            We’re actively adding more departments. Check back for expanded coverage.
          </div>
          <div className="items-center justify-center gap-x-3 space-y-3 sm:flex sm:space-y-0">
            <Button asChild>
              <a href="/profile">Create your profile</a>
            </Button>
            <Button variant="ghost" onClick={() => {
              try { howRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch {}
            }}>How it works</Button>
          </div>
        </div>
        <motion.div
          id="how-it-works"
          ref={howRef}
          className="mx-auto mt-32 max-w-5xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="grid gap-6 md:grid-cols-3">
            <motion.div
              className="rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-6 text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.45 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3a8a] text-white">
                <FiUserPlus className="h-5 w-5" />
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold mb-1">Create your profile</h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm">Add your interests, skills, and optionally a department to personalize matches.</p>
            </motion.div>
            <motion.div
              className="rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-6 text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3a8a] text-white">
                <FiSearch className="h-5 w-5" />
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold mb-1">See top matches</h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm">We analyze interests, skills, and publications to surface aligned professors.</p>
            </motion.div>
            <motion.div
              className="rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-6 text-left"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.45 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#1e3a8a] text-white">
                <FiMail className="h-5 w-5" />
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold mb-1">Draft and send</h3>
              <p className="text-slate-700 dark:text-slate-300 text-sm">Open the email editor to generate a tailored outreach email and send it.</p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      
    </section>
  )
}


