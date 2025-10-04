
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

export default function LoadingSpinner({ size = 'md', className = '', text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <div
          className={`${sizeClasses[size]} border-2 border-slate-300 dark:border-slate-600 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin`}
        />
        {text && (
          <p className="text-sm text-slate-600 dark:text-slate-400 animate-pulse">
            {text}
          </p>
        )}
      </div>
    </div>
  )
}
