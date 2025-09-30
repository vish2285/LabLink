export default function MatchScoreBadge({ scorePercent }: { scorePercent: number }) {
  const p = Math.round(scorePercent || 0)

  const classes = (() => {
    if (p >= 80) return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    if (p >= 60) return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
    if (p >= 40) return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
    return 'bg-gray-100 text-gray-700 ring-1 ring-gray-200'
  })()

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${classes}`} aria-label={`${p}% match`}>
      {p}% match
    </span>
  )
}
