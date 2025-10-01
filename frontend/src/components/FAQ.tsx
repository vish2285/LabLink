import React, { useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'

export type FaqItem = { q: string; a: React.ReactNode }

export default function FAQ({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="divide-y divide-slate-200/60 dark:divide-white/10 rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/70 dark:bg-white/5">
      {items.map((it, i) => (
        <div key={i} className="px-4 md:px-6 py-3">
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between text-left text-slate-900 dark:text-white font-medium"
            aria-expanded={open === i}
          >
            <span>{it.q}</span>
            <FiChevronDown className={`h-5 w-5 transition-transform ${open === i ? 'rotate-180' : ''}`} />
          </button>
          <div className={`overflow-hidden transition-all ${open === i ? 'mt-2 max-h-64' : 'max-h-0'}`}>
            <div className="text-sm text-slate-700 dark:text-slate-300/90 pr-6">{it.a}</div>
          </div>
        </div>
      ))}
    </div>
  )
}


