export default function Avatar({ name, photoUrl }: { name: string, photoUrl?: string }) {
  const initials = name.split(' ').map(n => n[0]).join('')
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover bg-gray-100"
        onError={(e) => {
          const t = e.target as HTMLImageElement
          t.style.display = 'none'
        }}
      />
    )
  }
  return (
    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-semibold text-base sm:text-lg">
      {initials}
    </div>
  )
}
