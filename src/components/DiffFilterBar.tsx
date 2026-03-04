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
    activeClass: 'bg-diff-added text-white',
    testId: 'filter-added',
    getCount: (s) => s.added,
  },
  {
    key: 'showRemoved',
    label: 'Removed',
    activeClass: 'bg-diff-removed text-white',
    testId: 'filter-removed',
    getCount: (s) => s.removed,
  },
  {
    key: 'showChanged',
    label: 'Changed',
    activeClass: 'bg-diff-changed text-gray-900',
    testId: 'filter-changed',
    getCount: (s) => s.changed,
  },
  {
    key: 'showTempoTimeSig',
    label: 'Tempo/Sig',
    activeClass: 'bg-diff-meta text-white',
    testId: 'filter-temposig',
    getCount: (s) => s.tempoChanges + s.timeSigChanges,
  },
]

export function DiffFilterBar({ filters, onFiltersChange, summary }: DiffFilterBarProps) {
  const disabled = summary === null

  return (
    <div data-testid="diff-filter-bar" className="flex items-center gap-2">
      {PILLS.map((pill) => {
        const active = filters[pill.key]
        const count = summary ? pill.getCount(summary) : 0
        return (
          <button
            key={pill.key}
            data-testid={pill.testId}
            className={`text-xs font-semibold px-3 py-1 rounded-full transition-all duration-150 ${
              active ? pill.activeClass : 'bg-chrome-bg-subtle text-chrome-text-muted'
            } ${disabled ? 'opacity-50 cursor-default' : 'cursor-pointer hover:opacity-90 hover:shadow-sm'}`}
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
