import { useState } from 'react'

export default function Avatar({ name, photoUrl }: { name: string, photoUrl?: string }) {
  const [failed, setFailed] = useState(false)
  const initials = name.split(' ').map(n => n[0]).join('')

  if (photoUrl && !failed) {
    return (
      <img
        src={photoUrl}
        alt={name}
        referrerPolicy="no-referrer"
        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover bg-gray-100"
        onError={() => setFailed(true)}
      />
    )
  }
  return (
    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 font-semibold text-sm sm:text-base">
      {initials}
    </div>
  )
}
