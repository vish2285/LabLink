import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import MatchScoreBadge from './MatchScoreBadge'
import { TagList } from './Tag'
import { FiExternalLink, FiMail } from 'react-icons/fi'

export type ProfessorCardProps = {
  professor: any
  onSelect: () => void
  centered?: boolean
  rank?: number
}

export default function ProfessorCard({ professor, onSelect, centered = false, rank }: ProfessorCardProps) {
  const navigate = useNavigate()
  const rankBadgeClass = rank === 1
    ? 'from-yellow-400 to-amber-600'
    : rank === 2
      ? 'from-slate-400 to-gray-500'
      : rank === 3
        ? 'from-amber-500 to-orange-600'
        : 'from-blue-600 to-indigo-700'

  // Consistent borders; tiered elevation by rank
  const containerAccent = rank === 1
    ? 'border-gray-200 shadow-lg'
    : rank === 2
      ? 'border-gray-200 shadow-md'
      : rank === 3
        ? 'border-gray-200 shadow'
        : 'border-gray-200 shadow-sm'
  
  return (
    <div className={`relative rounded-xl border border-white/10 bg-white/5 ${containerAccent}`}>
      {typeof rank === 'number' && (
        <div className="absolute -top-3 -left-3">
          <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${rankBadgeClass} text-white text-sm font-bold flex items-center justify-center shadow-md`}>
            {rank}
          </div>
        </div>
      )}
      <div className="p-6">
        <div className={`flex items-start justify-between mb-6`}>
          <div className="flex-1">
            <div className="mb-3">
              {/* Slightly larger avatar for top match */}
              <div className={`${centered ? 'scale-125 origin-left inline-block' : ''}`}>
                <Avatar name={professor.name} photoUrl={professor.photo_url} />
              </div>
            </div>
            <h3 className={`${centered ? 'text-2xl md:text-3xl' : 'text-xl'} font-semibold text-white mb-1`}>{professor.name}</h3>
            {professor.department && (
              <p className="text-slate-300 font-medium text-sm mb-2">{professor.department}</p>
            )}
          </div>
          <div className="flex flex-col items-end">
            <MatchScoreBadge scorePercent={professor.score_percent || 0} />
          </div>
        </div>

        {professor.research_interests && (
          <div className="mb-4">
            <p className="text-slate-200 leading-relaxed text-sm line-clamp-3">{professor.research_interests}</p>
          </div>
        )}

        {professor.skills && professor.skills.length > 0 && (
          <div className="mb-4">
            <TagList items={professor.skills} max={6} />
          </div>
        )}

        {professor.why && (
          <div className="mb-6 p-4 rounded-lg border border-white/10 bg-white/5">
            <div className="space-y-2">
              {professor.why.interests_hits.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                  <span className="text-xs text-slate-300">
                    <span className="font-medium text-white">Interests:</span> {professor.why.interests_hits.slice(0, 3).join(', ')}
                  </span>
                </div>
              )}
              {professor.why.skills_hits.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-xs text-slate-300">
                    <span className="font-medium text-white">Skills:</span> {professor.why.skills_hits.slice(0, 3).join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-2 grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`/professor/${professor.id}`)}
            className={`inline-flex items-center justify-center gap-1 rounded-md border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10 whitespace-nowrap`}
          >
            <FiExternalLink className="w-3 h-3" />
            View Profile
          </button>
          <button
            onClick={onSelect}
            className={`inline-flex items-center justify-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-white bg-[#1e3a8a] hover:bg-[#2544a0] whitespace-nowrap`}
          >
            <FiMail className="w-3 h-3" />
            Draft Email
          </button>
        </div>
      </div>
    </div>
  )
}
