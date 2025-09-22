import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ProfileForm from './pages/ProfileForm.tsx'
import Results from './pages/Results.tsx'
import EmailEditor from './pages/EmailEditor.tsx'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
            <Link to="/" className="font-semibold text-lg">Research Match</Link>
            <nav className="text-sm space-x-4">
              <Link to="/" className="hover:underline">Profile</Link>
              <Link to="/results" className="hover:underline">Results</Link>
              <Link to="/email" className="hover:underline">Email</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">
          <Routes>
            <Route path="/" element={<ProfileForm />} />
            <Route path="/results" element={<Results />} />
            <Route path="/email" element={<EmailEditor />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
