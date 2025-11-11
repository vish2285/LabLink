import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProfileForm from './pages/ProfileForm.tsx'
import Results from './pages/Results.tsx'
import EmailEditor from './pages/EmailEditor.tsx'
import ProfessorDetail from './pages/ProfessorDetail'
import Header from './components/Header.tsx'
import Landing from './pages/Landing.tsx'
import Footer from './components/Footer.tsx'
import About from './pages/About.tsx'
import Feedback from './pages/Feedback.tsx'
import Privacy from './pages/Privacy.tsx'
import { useApp } from './context/AppContext'
import { useEffect } from 'react'
import { useAuth } from './auth/AuthContext'
import SignIn from './pages/SignIn'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  const { theme, ensureDepartments } = useApp()
  const redirectPath = typeof window !== 'undefined' ? window.location.pathname : '/'
  const { isSignedIn } = useAuth()
  useEffect(() => {
    ensureDepartments()
  }, [])
  return (
    <BrowserRouter>
      <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'text-slate-100 bg-slate-900' : 'text-slate-900 bg-white'}`}>
        <Header />
        {/* Add padding-top to avoid overlap with fixed header */}
        <main className="w-full px-4 md:px-8 pt-24 md:pt-20 pb-8 flex-1">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route
                path="/profile"
                element={ isSignedIn ? <ProfileForm /> : <Navigate to="/sign-in" replace state={{ from: redirectPath }} /> }
              />
              <Route
                path="/matches"
                element={ isSignedIn ? <Results /> : <Navigate to="/sign-in" replace state={{ from: redirectPath }} /> }
              />
              <Route path="/results" element={<Navigate to="/matches" replace />} />
              <Route path="/professor/:id" element={<ProfessorDetail />} />
              <Route
                path="/email"
                element={ isSignedIn ? <EmailEditor /> : <Navigate to="/sign-in" replace state={{ from: redirectPath }} /> }
              />
              <Route path="/about" element={<About />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/sign-in" element={<SignIn />} />
            </Routes>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
