export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
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
        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">+{extra} more</span>
      )}
    </div>
  )
}
