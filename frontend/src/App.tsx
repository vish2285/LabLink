import React from 'react'
import { BrowserRouter, Routes, Route, Link, NavLink } from 'react-router-dom'
import ProfileForm from './pages/ProfileForm.tsx'
import Results from './pages/Results.tsx'
import EmailEditor from './pages/EmailEditor.tsx'
import Header from './components/Header.tsx'
import Landing from './pages/Landing.tsx'
import Footer from './components/Footer.tsx'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <Header />
        <main className="mx-auto max-w-6xl px-4 py-8 flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/profile" element={<ProfileForm />} />
            <Route path="/results" element={<Results />} />
            <Route path="/email" element={<EmailEditor />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
