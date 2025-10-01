export default function MatchScoreBadge({ scorePercent }: { scorePercent: number }) {
  const p = Math.round(scorePercent || 0)

  const classes = (() => {
    // In light mode use higher contrast; dark mode keeps subtle tones
    if (p >= 80) return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-400/15 dark:text-emerald-300 dark:ring-emerald-400/20'
    if (p >= 60) return 'bg-blue-100 text-blue-800 ring-1 ring-blue-200 dark:bg-blue-400/15 dark:text-blue-300 dark:ring-blue-400/20'
    if (p >= 40) return 'bg-amber-100 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/20'
    return 'bg-slate-100 text-slate-800 ring-1 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10'
  })()

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-semibold ${classes}`} aria-label={`${p}% match`}>
      {p}% match
    </span>
  )
}
