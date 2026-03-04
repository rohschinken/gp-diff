import type { DiffFilters, DiffResult } from '../diff/types'

export interface DiffFilterBarProps {
  filters: DiffFilters
  onFiltersChange: (filters: DiffFilters) => void
  summary: DiffResult['summary'] | null
}

interface PillConfig {
  key: keyof DiffFilters
  label: string
  activeClass: string
  testId: string
  getCount: (summary: DiffResult['summary']) => number
}

const PILLS: PillConfig[] = [
  {
    key: 'showAdded',
    label: 'Added',
    activeClass: 'bg-green-500 text-white',
    testId: 'filter-added',
    getCount: (s) => s.added,
  },
  {
    key: 'showRemoved',
    label: 'Removed',
    activeClass: 'bg-red-500 text-white',
    testId: 'filter-removed',
    getCount: (s) => s.removed,
  },
  {
    key: 'showChanged',
    label: 'Changed',
    activeClass: 'bg-yellow-500 text-white',
    testId: 'filter-changed',
    getCount: (s) => s.changed,
  },
  {
    key: 'showTempoTimeSig',
    label: 'Tempo/Sig',
    activeClass: 'bg-gray-700 text-white',
    testId: 'filter-temposig',
    getCount: (s) => s.tempoChanges + s.timeSigChanges,
  },
]

export function DiffFilterBar({ filters, onFiltersChange, summary }: DiffFilterBarProps) {
  const disabled = summary === null

  return (
    <div data-testid="diff-filter-bar" className="flex items-center justify-center gap-1.5 py-1 border-b border-gray-200">
      {PILLS.map((pill) => {
        const active = filters[pill.key]
        const count = summary ? pill.getCount(summary) : 0
        return (
          <button
            key={pill.key}
            data-testid={pill.testId}
            className={`text-xs font-medium px-2.5 py-0.5 rounded-full transition-colors ${
              active ? pill.activeClass : 'bg-gray-200 text-gray-500'
            } ${disabled ? 'opacity-50 cursor-default' : 'cursor-pointer hover:opacity-80'}`}
            onClick={() => {
              if (!disabled) {
                onFiltersChange({ ...filters, [pill.key]: !active })
              }
            }}
            disabled={disabled}
          >
            {pill.label} {count}
          </button>
        )
      })}
    </div>
  )
}
