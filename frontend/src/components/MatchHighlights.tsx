export default function MatchHighlights({ interests, skills }: { interests: string[]; skills: string[] }) {
  if ((!interests || interests.length === 0) && (!skills || skills.length === 0)) return null
  return (
    <div className="mb-6 p-4 rounded-lg border border-gray-100 bg-gray-50">
      <div className="space-y-2">
        {interests?.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
            <span className="text-xs text-gray-600">
              <span className="font-medium">Interests:</span> {interests.slice(0, 3).join(', ')}
            </span>
          </div>
        )}
        {skills?.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-600 rounded-full"></span>
            <span className="text-xs text-gray-600">
              <span className="font-medium">Skills:</span> {skills.slice(0, 3).join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
