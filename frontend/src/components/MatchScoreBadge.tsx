export default function MatchScoreBadge({ scorePercent }: { scorePercent: number }) {
  const p = Math.round(scorePercent || 0)

  const classes = (() => {
    if (p >= 80) return 'bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/20'
    if (p >= 60) return 'bg-blue-400/15 text-blue-300 ring-1 ring-blue-400/20'
    if (p >= 40) return 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/20'
    return 'bg-white/10 text-slate-300 ring-1 ring-white/10'
  })()

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${classes}`} aria-label={`${p}% match`}>
      {p}% match
    </span>
  )
}
