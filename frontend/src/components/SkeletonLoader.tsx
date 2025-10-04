interface SkeletonLoaderProps {
  className?: string
  lines?: number
  height?: string
}

export default function SkeletonLoader({ 
  className = '', 
  lines = 1, 
  height = 'h-4' 
}: SkeletonLoaderProps) {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={`${height} bg-slate-200 dark:bg-slate-700 rounded mb-2 ${
            index === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        />
      ))}
    </div>
  )
}

// Professor card skeleton
export function ProfessorCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-300/60 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4 sm:p-6">
      <div className="flex items-start justify-between mb-4 sm:mb-6">
        <div className="flex-1">
          <div className="mb-3">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
          </div>
          <SkeletonLoader lines={1} height="h-6" className="mb-2" />
          <SkeletonLoader lines={1} height="h-4" className="w-2/3" />
        </div>
        <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
      
      <SkeletonLoader lines={3} height="h-4" className="mb-4" />
      
      <div className="flex flex-wrap gap-2 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse"
            style={{ width: `${Math.random() * 40 + 60}px` }}
          />
        ))}
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
      </div>
    </div>
  )
}

// Results page skeleton
export function ResultsSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <div className="text-center space-y-2">
          <SkeletonLoader lines={1} height="h-10" className="mx-auto w-64 mb-4" />
          <SkeletonLoader lines={1} height="h-6" className="mx-auto w-96 mb-2" />
          <SkeletonLoader lines={1} height="h-4" className="mx-auto w-48" />
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid gap-6 md:gap-8">
          <div className="hidden md:grid gap-4 grid-cols-1 md:grid-cols-3 items-stretch">
            <ProfessorCardSkeleton />
            <ProfessorCardSkeleton />
            <ProfessorCardSkeleton />
          </div>
          <div className="md:hidden grid gap-4">
            <ProfessorCardSkeleton />
            <ProfessorCardSkeleton />
            <ProfessorCardSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}
