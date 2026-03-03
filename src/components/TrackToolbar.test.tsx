import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TrackToolbar, TrackInfo } from './TrackToolbar'

const tracksA: TrackInfo[] = [
  { index: 0, name: 'Electric Guitar' },
  { index: 1, name: 'Bass' },
  { index: 2, name: 'Drums' },
]

const tracksB: TrackInfo[] = [
  { index: 0, name: 'Electric Guitar' },
  { index: 1, name: 'Bass' },
  { index: 2, name: 'Drums' },
]

const tracksBMismatched: TrackInfo[] = [
  { index: 0, name: 'Acoustic Guitar' },
  { index: 1, name: 'Bass' },
]

const defaultProps = {
  tracksA,
  tracksB,
  selectedTrackIndex: 0,
  trackMapA: 0,
  trackMapB: 0,
  onTrackChange: vi.fn(),
  onTrackMapChange: vi.fn(),
}

describe('TrackToolbar', () => {
  it('renders track names from tracksA', () => {
    render(<TrackToolbar {...defaultProps} />)

    expect(screen.getByText('Electric Guitar')).toBeDefined()
    expect(screen.getByText('Bass')).toBeDefined()
    expect(screen.getByText('Drums')).toBeDefined()
  })

  it('clicking track N calls onTrackChange(N)', () => {
    const onTrackChange = vi.fn()
    render(<TrackToolbar {...defaultProps} onTrackChange={onTrackChange} />)

    fireEvent.click(screen.getByText('Bass'))

    expect(onTrackChange).toHaveBeenCalledOnce()
    expect(onTrackChange).toHaveBeenCalledWith(1)
  })

  it('selected track tab has active visual state', () => {
    render(<TrackToolbar {...defaultProps} selectedTrackIndex={1} />)

    const bassButton = screen.getByText('Bass').closest('button')
    const guitarButton = screen.getByText('Electric Guitar').closest('button')

    expect(bassButton?.className).toContain('bg-blue-600')
    expect(guitarButton?.className).not.toContain('bg-blue-600')
  })

  it('renders warning badge when track counts differ', () => {
    render(<TrackToolbar {...defaultProps} tracksB={tracksBMismatched} />)

    expect(screen.getByText(/track count mismatch/i)).toBeDefined()
  })

  it('does not render warning badge when track counts match', () => {
    render(<TrackToolbar {...defaultProps} />)

    expect(screen.queryByText(/track count mismatch/i)).toBeNull()
  })

  it('renders manual mapping dropdowns when track counts differ', () => {
    render(<TrackToolbar {...defaultProps} tracksB={tracksBMismatched} />)

    const selects = screen.getAllByRole('combobox')
    expect(selects.length).toBe(2)
  })

  it('dropdown A calls onTrackMapChange with side A and index', () => {
    const onTrackMapChange = vi.fn()
    render(
      <TrackToolbar
        {...defaultProps}
        tracksB={tracksBMismatched}
        onTrackMapChange={onTrackMapChange}
      />
    )

    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: '2' } })

    expect(onTrackMapChange).toHaveBeenCalledOnce()
    expect(onTrackMapChange).toHaveBeenCalledWith('A', 2)
  })

  it('dropdown B calls onTrackMapChange with side B and index', () => {
    const onTrackMapChange = vi.fn()
    render(
      <TrackToolbar
        {...defaultProps}
        tracksB={tracksBMismatched}
        onTrackMapChange={onTrackMapChange}
      />
    )

    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[1], { target: { value: '1' } })

    expect(onTrackMapChange).toHaveBeenCalledOnce()
    expect(onTrackMapChange).toHaveBeenCalledWith('B', 1)
  })

  it('does not render dropdowns when only one file loaded', () => {
    render(<TrackToolbar {...defaultProps} tracksB={null} />)

    expect(screen.queryAllByRole('combobox').length).toBe(0)
  })

  it('renders nothing when tracksA is null', () => {
    const { container } = render(<TrackToolbar {...defaultProps} tracksA={null} />)

    expect(container.innerHTML).toBe('')
  })
})
