export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-200 border border-white/10">
      {children}
    </span>
  )
}

export function TagList({ items, max = 6 }: { items: string[]; max?: number }) {
  const visible = items.slice(0, max)
  const extra = items.length - visible.length
  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((s, i) => (
        <Tag key={i}>{s}</Tag>
      ))}
      {extra > 0 && (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-[#7cc4ff] border border-white/10">+{extra} more</span>
      )}
    </div>
  )
}
