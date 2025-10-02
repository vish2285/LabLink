import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md'

function ButtonBase({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const base = 'inline-flex items-center justify-center whitespace-nowrap rounded-md smooth focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-white/20'
  const sizes: Record<Size, string> = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
  }
  const variants: Record<Variant, string> = {
    primary: 'bg-[#1e3a8a] text-white shadow-lg ring-1 ring-slate-300/60 dark:ring-white/10 hover:bg-[#2544a0] active:scale-[0.99] disabled:opacity-60',
    secondary: 'bg-green-700 text-white shadow-lg ring-1 ring-slate-300/60 dark:ring-white/10 hover:bg-green-800 active:scale-[0.99] disabled:opacity-60',
    ghost: 'border border-slate-300/60 dark:border-white/20 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10',
  }
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`
  return <button className={cls} {...props}>{children}</button>
}

export default function Button(props: any) {
  if (props.asChild) {
    const { asChild, variant, size, className, children, ...rest } = props as { asChild: boolean; variant?: Variant; size?: Size; className?: string; children: any }
    const base = 'inline-flex items-center justify-center whitespace-nowrap rounded-md smooth focus:outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-white/20'
    const sizes: Record<Size, string> = { sm: 'h-9 px-3 text-sm', md: 'h-10 px-4 text-sm' }
    const variants: Record<Variant, string> = {
      primary: 'bg-[#1e3a8a] text-white shadow-lg ring-1 ring-slate-300/60 dark:ring-white/10 hover:bg-[#2544a0] active:scale-[0.99] disabled:opacity-60',
      secondary: 'bg-green-700 text-white shadow-lg ring-1 ring-slate-300/60 dark:ring-white/10 hover:bg-green-800 active:scale-[0.99] disabled:opacity-60',
      ghost: 'border border-slate-300/60 dark:border-white/20 bg-white/70 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10',
    }
    const cls = `${base} ${sizes[(size || 'md') as Size]} ${variants[(variant || 'primary') as Variant]} ${className || ''}`
    return React.cloneElement(children, { className: `${children.props.className || ''} ${cls}`, ...rest })
  }
  return <ButtonBase {...props} />
}


