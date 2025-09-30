import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import ProfessorCard from '../components/ProfessorCard'
import EmptyState from '../components/EmptyState'

export default function Results() {
  const navigate = useNavigate()
  const { results, selectProfessor, setEmailDraft } = useApp()

  function handleSelect(index: number) {
    const prof = results[index]
    selectProfessor(prof)
    const draft = `Hello Professor ${prof.name},\n\n` +
      `I'm a student interested in ${prof.research_interests || 'your research areas'}. ` +
      `I'd love to learn more about opportunities to contribute to your lab.\n\n` +
      `Best,\n[Your Name]`
    setEmailDraft(draft)
    navigate('/email')
  }

  if (!results?.length) return <EmptyState />

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Top Matches</h1>
          <p className="text-gray-600">Discover UC Davis professors aligned with your interests and skills.</p>
          <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
            <Link to="/profile" className="hover:text-blue-700">Edit Profile</Link>
            <span>•</span>
            <span>{results.length} matches found</span>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid gap-6 md:gap-8">
          {/* Top 3 Ranking */}
          {results.length > 0 && (
            <div className="mb-10">
              
              <div className="grid gap-4 md:grid-cols-3">
                {results[1] && (
                  <ProfessorCard
                    professor={results[1]}
                    onSelect={() => handleSelect(1)}
                    rank={2}
                  />
                )}
                <ProfessorCard
                  professor={results[0]}
                  onSelect={() => handleSelect(0)}
                  rank={1}
                />
                {results[2] && (
                  <ProfessorCard
                    professor={results[2]}
                    onSelect={() => handleSelect(2)}
                    rank={3}
                  />
                )}
              </div>
            </div>
          )}

          {/* Other Matches */}
          {results.length > 1 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-sm font-medium text-gray-700">More Matches</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {results.slice(3).map((professor, index) => (
                  <ProfessorCard
                    key={index + 3}
                    professor={professor}
                    onSelect={() => handleSelect(index + 3)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


