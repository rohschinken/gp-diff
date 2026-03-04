import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DiffFilterBar } from './DiffFilterBar'
import { DEFAULT_DIFF_FILTERS } from '../diff/types'
import type { DiffResult, DiffFilters } from '../diff/types'

// --- Helpers ---

function makeSummary(
  overrides?: Partial<DiffResult['summary']>,
): DiffResult['summary'] {
  return {
    equal: 10,
    added: 3,
    removed: 2,
    changed: 5,
    tempoChanges: 1,
    timeSigChanges: 1,
    totalMeasures: 20,
    ...overrides,
  }
}

function renderBar(overrides?: {
  filters?: DiffFilters
  onFiltersChange?: (filters: DiffFilters) => void
  summary?: DiffResult['summary'] | null
}) {
  const props = {
    filters: overrides?.filters ?? DEFAULT_DIFF_FILTERS,
    onFiltersChange: overrides?.onFiltersChange ?? vi.fn(),
    summary: overrides?.summary !== undefined ? overrides.summary : makeSummary(),
  }
  return { ...render(<DiffFilterBar {...props} />), props }
}

describe('DiffFilterBar rendering', () => {
  it('renders all four filter buttons', () => {
    renderBar()
    expect(screen.getByTestId('filter-added')).toBeDefined()
    expect(screen.getByTestId('filter-removed')).toBeDefined()
    expect(screen.getByTestId('filter-changed')).toBeDefined()
    expect(screen.getByTestId('filter-temposig')).toBeDefined()
  })

  it('displays correct count for Added', () => {
    renderBar({ summary: makeSummary({ added: 7 }) })
    expect(screen.getByTestId('filter-added').textContent).toBe('Added 7')
  })

  it('displays correct count for Removed', () => {
    renderBar({ summary: makeSummary({ removed: 4 }) })
    expect(screen.getByTestId('filter-removed').textContent).toBe('Removed 4')
  })

  it('displays correct count for Changed', () => {
    renderBar({ summary: makeSummary({ changed: 9 }) })
    expect(screen.getByTestId('filter-changed').textContent).toBe('Changed 9')
  })

  it('displays combined count for Tempo/Sig', () => {
    renderBar({ summary: makeSummary({ tempoChanges: 3, timeSigChanges: 2 }) })
    expect(screen.getByTestId('filter-temposig').textContent).toBe('Tempo/Sig 5')
  })

  it('renders the container with data-testid', () => {
    renderBar()
    expect(screen.getByTestId('diff-filter-bar')).toBeDefined()
  })
})

describe('DiffFilterBar toggle behavior', () => {
  it('clicking Added calls onFiltersChange with showAdded: false', () => {
    const onFiltersChange = vi.fn()
    renderBar({ onFiltersChange })
    fireEvent.click(screen.getByTestId('filter-added'))
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...DEFAULT_DIFF_FILTERS,
      showAdded: false,
    })
  })

  it('clicking Removed calls onFiltersChange with showRemoved: false', () => {
    const onFiltersChange = vi.fn()
    renderBar({ onFiltersChange })
    fireEvent.click(screen.getByTestId('filter-removed'))
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...DEFAULT_DIFF_FILTERS,
      showRemoved: false,
    })
  })

  it('clicking inactive filter re-enables it', () => {
    const onFiltersChange = vi.fn()
    renderBar({
      filters: { ...DEFAULT_DIFF_FILTERS, showAdded: false },
      onFiltersChange,
    })
    fireEvent.click(screen.getByTestId('filter-added'))
    expect(onFiltersChange).toHaveBeenCalledWith({
      ...DEFAULT_DIFF_FILTERS,
      showAdded: true,
    })
  })
})

describe('DiffFilterBar visual states', () => {
  it('active buttons have colored class, inactive have grey', () => {
    renderBar({
      filters: { ...DEFAULT_DIFF_FILTERS, showAdded: false },
    })
    const added = screen.getByTestId('filter-added')
    const removed = screen.getByTestId('filter-removed')
    expect(added.className).toContain('bg-chrome-bg-subtle')
    expect(removed.className).toContain('bg-diff-removed')
  })

  it('counts update when summary changes', () => {
    const onFiltersChange = vi.fn() as unknown as (filters: DiffFilters) => void
    const { rerender } = renderBar({ summary: makeSummary({ added: 3 }), onFiltersChange })
    expect(screen.getByTestId('filter-added').textContent).toBe('Added 3')

    rerender(
      <DiffFilterBar
        filters={DEFAULT_DIFF_FILTERS}
        onFiltersChange={onFiltersChange}
        summary={makeSummary({ added: 10 })}
      />,
    )
    expect(screen.getByTestId('filter-added').textContent).toBe('Added 10')
  })
})

describe('DiffFilterBar disabled state', () => {
  it('shows count 0 and disabled pills when summary is null', () => {
    renderBar({ summary: null })
    const added = screen.getByTestId('filter-added')
    expect(added.textContent).toBe('Added 0')
    expect(added.className).toContain('opacity-50')
  })

  it('disabled pills do not fire onFiltersChange on click', () => {
    const onFiltersChange = vi.fn()
    renderBar({ summary: null, onFiltersChange })
    fireEvent.click(screen.getByTestId('filter-added'))
    expect(onFiltersChange).not.toHaveBeenCalled()
  })
})
