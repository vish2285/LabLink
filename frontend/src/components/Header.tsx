import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/60 backdrop-blur">
      <div
        className={classNames(
          'mx-auto max-w-6xl px-4',
          'flex items-center justify-between gap-x-6 py-3'
        )}
      >
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden text-slate-300 hover:text-white"
            onClick={() => setOpen(s => !s)}
            aria-label="Toggle navigation"
          >
            {open ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path
                  fillRule="evenodd"
                  d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm8.25 5.25a.75.75 0 01.75-.75h8.25a.75.75 0 010 1.5H12a.75.75 0 01-.75-.75z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          <Link to="/" className="flex items-center gap-2 text-slate-100">
            <img src="/lablink.png" alt="LabLink logo" className="h-10 w-10" />
            <span className="text-xl font-semibold ">LabLink</span>
          </Link>
        </div>

        <nav className={classNames('lg:flex items-center gap-6', open ? 'block' : 'hidden lg:block')}>
          <ul className="flex items-center gap-6">
            {[
              { title: 'Home', path: '/' },
              { title: 'Profile', path: '/profile' },
              { title: 'Results', path: '/results' },
              { title: 'Email', path: '/email' },
            ].map(link => (
              <li key={link.title}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    classNames(
                      'rounded px-3 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white',
                      isActive && 'bg-white/10 text-white'
                    )
                  }
                >
                  {link.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden lg:flex" />
      </div>
      {open && (
        <div className="border-t border-white/10 bg-slate-900/80 lg:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-3 space-y-2">
            {[
              { title: 'Profile', path: '/' },
              { title: 'Results', path: '/results' },
              { title: 'Email', path: '/email' },
            ].map(l => (
              <li key={l.title}>
                <NavLink
                  to={l.path}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    classNames(
                      'block rounded px-3 py-2 text-sm text-slate-300 hover:bg-white/10',
                      isActive && 'bg-white/10 text-white'
                    )
                  }
                >
                  {l.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  )
}


