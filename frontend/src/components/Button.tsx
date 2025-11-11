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
  const base = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes: Record<Size, string> = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-10 px-5 text-sm',
  }
  const variants: Record<Variant, string> = {
    primary: 'bg-gradient-to-br from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white hover:from-indigo-700 hover:to-blue-700 dark:hover:from-indigo-600 dark:hover:to-blue-600 shadow-sm active:scale-[0.98]',
    secondary: 'border border-slate-300/70 dark:border-white/20 bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 active:scale-[0.98]',
    ghost: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-[0.98]',
  }
  const cls = `${base} ${sizes[size]} ${variants[variant]} ${className}`
  return <button className={cls} {...props}>{children}</button>
}

export default function Button(props: any) {
  if (props.asChild) {
    const { asChild, variant, size, className, children, ...rest } = props as { asChild: boolean; variant?: Variant; size?: Size; className?: string; children: any }
    const base = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/50 disabled:opacity-50 disabled:cursor-not-allowed'
    const sizes: Record<Size, string> = { sm: 'h-9 px-4 text-sm', md: 'h-10 px-5 text-sm' }
    const variants: Record<Variant, string> = {
      primary: 'bg-gradient-to-br from-indigo-600 to-blue-600 dark:from-indigo-500 dark:to-blue-500 text-white hover:from-indigo-700 hover:to-blue-700 dark:hover:from-indigo-600 dark:hover:to-blue-600 shadow-sm active:scale-[0.98]',
      secondary: 'border border-slate-300/70 dark:border-white/20 bg-white/80 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 active:scale-[0.98]',
      ghost: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 active:scale-[0.98]',
    }
    const cls = `${base} ${sizes[(size || 'md') as Size]} ${variants[(variant || 'primary') as Variant]} ${className || ''}`
    return React.cloneElement(children, { className: `${children.props.className || ''} ${cls}`, ...rest })
  }
  return <ButtonBase {...props} />
}


