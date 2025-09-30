import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ProfileForm from './pages/ProfileForm.tsx'
import Results from './pages/Results.tsx'
import EmailEditor from './pages/EmailEditor.tsx'
import ProfessorDetail from './pages/ProfessorDetail'
import Header from './components/Header.tsx'
import Landing from './pages/Landing.tsx'
import Footer from './components/Footer.tsx'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col text-slate-100 bg-gradient-to-b from-[#0b1220] via-[#0a0f1a] to-[#05080f]">
        <Header />
        <main className="w-full px-4 md:px-8 py-8 flex-1">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/profile" element={<ProfileForm />} />
            <Route path="/results" element={<Results />} />
            <Route path="/professor/:id" element={<ProfessorDetail />} />
            <Route path="/email" element={<EmailEditor />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
