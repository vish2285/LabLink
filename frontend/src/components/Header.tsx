import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { FiSun, FiMoon } from 'react-icons/fi'
import { useAuth } from '../auth/AuthContext'
import Avatar from './Avatar'

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function Header() {
  const [open, setOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { theme, toggleTheme } = useApp()
  const { isSignedIn, signOut, user } = useAuth() as any

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/60 backdrop-blur">
      <div
        className={classNames(
          'mx-auto max-w-6xl px-4',
          'flex items-center justify-between gap-x-6 py-3'
        )}
      >
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
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

          <Link to="/" className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
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
                      'rounded px-3 py-2 text-sm text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
                      isActive && 'bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white'
                    )
                  }
                >
                  {link.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          {!isSignedIn ? (
            <Link to="/sign-in" className="rounded-lg px-3 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700">Sign in</Link>
          ) : (
            <div className="relative">
              <button
                className="inline-flex items-center gap-2"
                onClick={() => setUserMenuOpen(s => !s)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                aria-label="Account menu"
              >
                <Avatar name={user?.name || user?.email || 'User'} photoUrl={user?.picture} />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-lg p-2 z-20" role="menu">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.name || 'Signed in'}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{user?.email}</p>
                  </div>
                  <div className="mt-1 border-t border-slate-200 dark:border-white/10" />
                  <button
                    onClick={() => { setUserMenuOpen(false); signOut() }}
                    className="mt-1 w-full text-left rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                    role="menuitem"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={toggleTheme}
            className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10"
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          >
            {theme === 'dark' ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-slate-200/60 bg-white/80 dark:border-white/10 dark:bg-slate-900/80 lg:hidden">
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
                      'block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10',
                      isActive && 'bg-slate-900/5 text-slate-900 dark:bg-white/10 dark:text-white'
                    )
                  }
                >
                  {l.title}
                </NavLink>
              </li>
            ))}
            <li>
              <button
                onClick={() => { toggleTheme(); setOpen(false) }}
                className="inline-flex items-center gap-2 rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10"
                aria-label="Toggle theme"
                title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
              >
                {theme === 'dark' ? <FiSun className="h-4 w-4" /> : <FiMoon className="h-4 w-4" />}
                <span className="sr-only">Toggle theme</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  )
}


