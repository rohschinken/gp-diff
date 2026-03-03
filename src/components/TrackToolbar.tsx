export interface TrackInfo {
  index: number
  name: string
}

export interface TrackToolbarProps {
  tracksA: TrackInfo[] | null
  tracksB: TrackInfo[] | null
  selectedTrackIndex: number
  trackMapA: number
  trackMapB: number
  onTrackChange: (index: number) => void
  onTrackMapChange: (side: 'A' | 'B', index: number) => void
}

export function TrackToolbar({
  tracksA,
  tracksB,
  selectedTrackIndex,
  trackMapA,
  trackMapB,
  onTrackChange,
  onTrackMapChange,
}: TrackToolbarProps) {
  if (!tracksA) return null

  const hasMismatch = tracksB !== null && tracksA.length !== tracksB.length

  return (
    <div className="flex items-center gap-2 px-4 py-1 border-b border-gray-200 bg-gray-50 overflow-x-auto">
      <div className="flex items-center gap-1">
        {tracksA.map((track) => (
          <button
            key={track.index}
            onClick={() => onTrackChange(track.index)}
            className={`text-sm px-3 py-1 rounded ${
              track.index === selectedTrackIndex
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {track.name}
          </button>
        ))}
      </div>

      {hasMismatch && (
        <>
          <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
            Track count mismatch
          </span>

          <div className="flex items-center gap-2 ml-auto">
            <label className="text-xs text-gray-500">
              A:
              <select
                className="ml-1 text-sm border border-gray-300 rounded px-1"
                value={trackMapA}
                onChange={(e) => onTrackMapChange('A', Number(e.target.value))}
              >
                {tracksA.map((t) => (
                  <option key={t.index} value={t.index}>{t.name}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-gray-500">
              B:
              <select
                className="ml-1 text-sm border border-gray-300 rounded px-1"
                value={trackMapB}
                onChange={(e) => onTrackMapChange('B', Number(e.target.value))}
              >
                {tracksB!.map((t) => (
                  <option key={t.index} value={t.index}>{t.name}</option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}
    </div>
  )
}
