'use client'

interface ImportProfile {
  id: string
  name: string
  description?: string
  columnMapping: Record<string, string>
}

interface ProfileSelectorProps {
  profiles: ImportProfile[]
  selectedProfile: ImportProfile | null
  onSelect: (profile: ImportProfile | null) => void
}

export default function ProfileSelector({
  profiles,
  selectedProfile,
  onSelect,
}: ProfileSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Import Profile (Optional)
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* No Profile Option */}
        <button
          onClick={() => onSelect(null)}
          className={`p-4 rounded-lg border-2 text-left transition-all ${
            !selectedProfile
              ? 'border-primary-500 bg-primary-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                !selectedProfile ? 'border-primary-500' : 'border-gray-300'
              }`}
            >
              {!selectedProfile && (
                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
              )}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">Auto-detect</div>
              <div className="text-sm text-gray-500 mt-1">
                Automatically map columns based on header names
              </div>
            </div>
          </div>
        </button>

        {/* Profile Options */}
        {profiles.map((profile) => (
          <button
            key={profile.id}
            onClick={() => onSelect(profile)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedProfile?.id === profile.id
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                  selectedProfile?.id === profile.id
                    ? 'border-primary-500'
                    : 'border-gray-300'
                }`}
              >
                {selectedProfile?.id === profile.id && (
                  <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">{profile.name}</div>
                {profile.description && (
                  <div className="text-sm text-gray-500 mt-1">{profile.description}</div>
                )}
                <div className="text-xs text-gray-400 mt-2">
                  {Object.keys(profile.columnMapping).length} fields mapped
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="mt-2 text-sm text-gray-500">
          No saved profiles yet. Upload a file and save your column mapping as a template for
          future imports.
        </div>
      )}
    </div>
  )
}
