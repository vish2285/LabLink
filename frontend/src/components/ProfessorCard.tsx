import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import MatchScoreBadge from './MatchScoreBadge'
import { TagList } from './Tag'
import { FiExternalLink, FiMail, FiBookOpen, FiTag } from 'react-icons/fi'

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

  const rankSizeClass = rank === 1
    ? 'h-10 w-10 text-base'
    : rank === 2
      ? 'h-9 w-9 text-sm'
      : 'h-8 w-8 text-sm'

  // Consistent borders; tiered elevation by rank
  const containerAccent = rank === 1
    ? 'shadow-lg'
    : rank === 2
      ? 'shadow-md'
      : rank === 3
        ? 'shadow'
        : 'shadow-sm'

  const interestHits: string[] = (professor?.why?.interests_hits || []).slice(0, 4)
  const skillHits: string[] = (professor?.why?.skills_hits || []).slice(0, 4)

  return (
    <div className={`group relative rounded-2xl p-[1px] bg-gradient-to-br from-indigo-500/20 to-sky-400/10 ${containerAccent} transition-transform duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl hover:shadow-black/20`}>
      {typeof rank === 'number' && (
        <div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 z-20">
          <div className={`${rankSizeClass} rounded-full bg-gradient-to-br ${rankBadgeClass} text-white font-bold flex items-center justify-center shadow-md`}>{rank}</div>
        </div>
      )}
      <div className="relative z-10 rounded-2xl bg-white/85 dark:bg-slate-900/60 backdrop-blur p-3 sm:p-4 md:p-6 border border-slate-200/60 dark:border-white/10">
        {/* Header */}
        <div className={`flex items-start justify-between mb-3 sm:mb-4 md:mb-6`}>
          <div className="flex-1 min-w-0">
            <div className="mb-2 sm:mb-3">
              {/* Slightly larger avatar for top match */}
              <div className={`${centered ? 'scale-125 origin-left inline-block' : ''}`}>
                <Avatar name={professor.name} photoUrl={professor.photo_url} />
              </div>
            </div>
            <h3 className={`${centered ? 'text-xl sm:text-2xl md:text-3xl' : 'text-base sm:text-lg md:text-xl'} font-semibold text-slate-900 dark:text-white mb-1 truncate`}>{professor.name}</h3>
            {professor.department && (
              <p className="text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm mb-2 truncate">{professor.department}</p>
            )}
          </div>
          <div className="flex flex-col items-end ml-2">
            <MatchScoreBadge scorePercent={professor.score_percent || 0} />
          </div>
        </div>

        {/* Interests excerpt */}
        {professor.research_interests && (
          <div className="mb-3 sm:mb-4">
            <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-xs sm:text-sm line-clamp-3">
              {professor.research_interests}
            </p>
          </div>
        )}

        {/* Professor skills (lab tags) */}
        {professor.skills && professor.skills.length > 0 && (
          <div className="mb-3 sm:mb-4">
            <TagList items={professor.skills} max={999} />
          </div>
        )}

        {/* Why this is a match */}
        {(interestHits.length > 0 || skillHits.length > 0) && (
          <div className="mb-4 sm:mb-5 rounded-xl border border-slate-200/70 dark:border-white/10 bg-gradient-to-br from-slate-50/90 to-white/60 dark:from-white/5 dark:to-white/5 p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block h-2 w-2 rounded-full bg-indigo-500 dark:bg-indigo-400" />
              <span className="text-xs font-semibold tracking-wide text-slate-800 dark:text-slate-200 uppercase">Why this matched</span>
            </div>
            <div className="grid gap-2">
              {interestHits.length > 0 && (
                <div className="flex items-start gap-2">
                  <FiBookOpen className="mt-[2px] h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1.5">
                    {interestHits.map((h, i) => (
                      <span key={`ih-${i}`} className="inline-flex items-center rounded-full border border-indigo-300/70 dark:border-indigo-400/30 bg-indigo-50/70 dark:bg-indigo-400/10 px-2 py-0.5 text-[11px] text-indigo-700 dark:text-indigo-300">{h}</span>
                    ))}
                  </div>
                </div>
              )}
              {skillHits.length > 0 && (
                <div className="flex items-start gap-2">
                  <FiTag className="mt-[2px] h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <div className="flex flex-wrap gap-1.5">
                    {skillHits.map((h, i) => (
                      <span key={`sh-${i}`} className="inline-flex items-center rounded-full border border-emerald-300/70 dark:border-emerald-400/30 bg-emerald-50/70 dark:bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">{h}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate(`/professor/${professor.id}`)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300/70 dark:border-white/20 bg-white/80 dark:bg-white/5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
          >
            <FiExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Profile</span>
            <span className="sm:hidden">View</span>
          </button>
          <button
            onClick={onSelect}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:from-indigo-700 hover:to-blue-700 dark:hover:from-indigo-600 dark:hover:to-blue-600 shadow-sm transition-all"
          >
            <FiMail className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Draft Email</span>
            <span className="sm:hidden">Email</span>
          </button>
        </div>
      </div>
    </div>
  )}
