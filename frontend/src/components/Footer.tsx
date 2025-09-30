export default function Footer() {
  return (
    <footer className="bg-slate-900/60 border-t border-white/10 py-5 text-slate-300">
      <div className="mx-auto max-w-screen-xl px-4 md:px-8">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="text-base font-semibold text-white"><span className="text-[#FFBF00]">Lab</span>Link</div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-400">
            <a className="hover:underline hover:text-white" href="/about">About</a>
            <a className="hover:underline hover:text-white" href="/feedback">Feedback</a>
            <a className="hover:underline hover:text-white" href="mailto:lablinkdavis@gmail.com">Email</a>
          </nav>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} LabLink</p>
        </div>
      </div>
    </footer>
  )
}


