export default function Footer() {
  return (
    <footer className="text-gray-500 bg-white py-5">
      <div className="mx-auto max-w-screen-xl px-4 md:px-8">
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <div className="text-base font-semibold text-gray-800"><span className="text-[#FFBF00]">Research</span>Match</div>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-600">
            <a className="hover:underline hover:text-indigo-600" href="#about">About</a>
            <a className="hover:underline hover:text-indigo-600" href="#privacy">Privacy</a>
            <a className="hover:underline hover:text-indigo-600" href="#terms">Terms</a>
            <a className="hover:underline hover:text-indigo-600" href="mailto:researchmatch@ucdavis.edu">Email</a>
            <a className="hover:underline hover:text-indigo-600" href="#report-bug">Report a Bug</a>
          </nav>
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} ResearchMatch</p>
        </div>
      </div>
    </footer>
  )
}


