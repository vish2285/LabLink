import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

// Animated Counter Component
function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    let startTime: number
    const startValue = 0
    const endValue = value
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)
      
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(startValue + (endValue - startValue) * easeOutQuart))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value, duration])
  
  return <span>{count}%</span>
}

// Match Score Badge Component
function MatchScoreBadge({ score, isTopMatch = false }: { score: number; isTopMatch?: boolean }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-green-600'
    if (score >= 60) return 'from-blue-500 to-cyan-600'
    if (score >= 40) return 'from-amber-500 to-orange-600'
    return 'from-gray-400 to-gray-500'
  }
  
  return (
    <div className={`relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${getScoreColor(score)} shadow-lg ${isTopMatch ? 'ring-4 ring-white/20 scale-110' : ''}`}>
      <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-sm"></div>
      <span className="relative text-white font-bold text-lg">
        <AnimatedCounter value={score} />
      </span>
    </div>
  )
}

// Professor Card Component
function ProfessorCard({ professor, index, isTopMatch = false, onSelect }: {
  professor: any
  index: number
  isTopMatch?: boolean
  onSelect: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl transition-all duration-500 ease-out ${
        isTopMatch 
          ? 'bg-gradient-to-br from-white via-blue-50/50 to-indigo-50/30 border-2 border-blue-200/50 shadow-2xl shadow-blue-500/10' 
          : 'bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-xl'
      } ${isHovered ? 'scale-[1.02] shadow-2xl' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: `${index * 100}ms`,
        animation: 'fadeInUp 0.6s ease-out forwards'
      }}
    >
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none"></div>
      
      {/* Top match badge */}
      {isTopMatch && (
        <div className="absolute top-4 right-4 z-10">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
            ⭐ TOP MATCH
          </div>
        </div>
      )}
      
      <div className="relative p-6">
        {/* Header with avatar and match score */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            {/* Avatar placeholder with gradient */}
            <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl mb-3 shadow-lg ${isHovered ? 'scale-110' : ''} transition-transform duration-300`}>
              {professor.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            
            <h3 className={`font-bold text-gray-900 mb-1 ${isTopMatch ? 'text-2xl' : 'text-xl'}`}>
              {professor.name}
            </h3>
            
            {professor.department && (
              <p className="text-gray-600 font-medium text-sm mb-2">
                {professor.department}
              </p>
            )}
          </div>
          
          {/* Match score */}
          <div className="flex flex-col items-center">
            <MatchScoreBadge score={professor.score_percent || 0} isTopMatch={isTopMatch} />
            <span className="text-xs text-gray-500 mt-2 font-medium">Match</span>
          </div>
        </div>
        
        {/* Research interests */}
        {professor.research_interests && (
          <div className="mb-4">
            <p className="text-gray-700 leading-relaxed text-sm line-clamp-3">
              {professor.research_interests}
            </p>
          </div>
        )}
        
        {/* Skills tags */}
        {professor.skills && professor.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {professor.skills.slice(0, 6).map((skill: string, idx: number) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  {skill}
                </span>
              ))}
              {professor.skills.length > 6 && (
                <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-200 text-blue-700 rounded-full text-xs font-medium shadow-sm">
                  +{professor.skills.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Match reasoning */}
        {professor.why && (
          <div className="mb-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-xl border border-gray-100">
            <div className="space-y-2">
              {professor.why.interests_hits.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  <span className="text-xs text-gray-600">
                    <span className="font-medium">Interests:</span> {professor.why.interests_hits.slice(0, 3).join(', ')}
                  </span>
                </div>
              )}
              {professor.why.skills_hits.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-xs text-gray-600">
                    <span className="font-medium">Skills:</span> {professor.why.skills_hits.slice(0, 3).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Action button */}
        <button
          onClick={() => {
            console.log('Button clicked for professor:', professor.name)
            onSelect()
          }}
          className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all duration-300 cursor-pointer ${
            isTopMatch 
              ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-xl' 
              : 'bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black shadow-md hover:shadow-lg'
          } ${isHovered ? 'scale-105' : ''}`}
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Draft Email
          </span>
        </button>
      </div>
      
      {/* Hover glow effect */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-pink-500/0 transition-opacity duration-500 ${isHovered ? 'opacity-10' : 'opacity-0'}`}></div>
    </div>
  )
}

export default function Results() {
  const navigate = useNavigate()
  const { results, selectProfessor, setEmailDraft } = useApp()

  function handleSelect(index: number) {
    console.log('Selecting professor at index:', index)
    const prof = results[index]
    console.log('Selected professor:', prof)
    
    selectProfessor(prof)
    const draft = `Hello Professor ${prof.name},\n\n` +
      `I'm a student interested in ${prof.research_interests || 'your research areas'}. ` +
      `I'd love to learn more about opportunities to contribute to your lab.\n\n` +
      `Best,\n[Your Name]`
    setEmailDraft(draft)
    console.log('Navigating to email page...')
    navigate('/email')
  }

  if (!results?.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No matches yet</h2>
            <p className="text-gray-600 mb-6">Let's find your perfect research match!</p>
            <Link 
              to="/profile" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Profile
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-pink-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200/50 shadow-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Live Results</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Your Perfect Matches
            </h1>
            
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover UC Davis professors who align with your research interests and skills
            </p>
            
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <Link 
                to="/profile" 
                className="flex items-center gap-2 hover:text-blue-600 transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Link>
              <span>•</span>
              <span>{results.length} matches found</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid gap-6 md:gap-8">
          {/* Top Match - Featured */}
          {results.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">1</span>
                </div>
                Top Match
              </h2>
              <div className="max-w-2xl mx-auto">
                <ProfessorCard
                  professor={results[0]}
                  index={0}
                  isTopMatch={true}
                  onSelect={() => handleSelect(0)}
                />
              </div>
            </div>
          )}

          {/* Other Matches */}
          {results.length > 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">2+</span>
                </div>
                More Matches
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {results.slice(1).map((professor, index) => (
                  <ProfessorCard
                    key={index + 1}
                    professor={professor}
                    index={index + 1}
                    onSelect={() => handleSelect(index + 1)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}


