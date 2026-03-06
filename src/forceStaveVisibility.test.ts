import { describe, it, expect } from 'vitest'
import { forceStaveVisibility } from './forceStaveVisibility'

function makeScore(tracks: { staves: { isPercussion: boolean }[] }[]) {
  return {
    tracks: tracks.map((t) => ({
      ...t,
      staves: t.staves.map((s) => ({
        ...s,
        showStandardNotation: false,
        showTablature: false,
      })),
    })),
  } as Parameters<typeof forceStaveVisibility>[0]
}

describe('forceStaveVisibility', () => {
  it('shows both notation and tab when showNotation=true', () => {
    const score = makeScore([{ staves: [{ isPercussion: false }] }])
    forceStaveVisibility(score, true)
    expect(score.tracks[0].staves[0].showStandardNotation).toBe(true)
    expect(score.tracks[0].staves[0].showTablature).toBe(true)
  })

  it('hides notation when showNotation=false', () => {
    const score = makeScore([{ staves: [{ isPercussion: false }] }])
    forceStaveVisibility(score, false)
    expect(score.tracks[0].staves[0].showStandardNotation).toBe(false)
    expect(score.tracks[0].staves[0].showTablature).toBe(true)
  })

  it('forces notation ON for percussion tracks even when showNotation=false', () => {
    const score = makeScore([{ staves: [{ isPercussion: true }] }])
    forceStaveVisibility(score, false)
    expect(score.tracks[0].staves[0].showStandardNotation).toBe(true)
    expect(score.tracks[0].staves[0].showTablature).toBe(true)
  })

  it('handles mixed percussion and non-percussion tracks', () => {
    const score = makeScore([
      { staves: [{ isPercussion: false }] },
      { staves: [{ isPercussion: true }] },
    ])
    forceStaveVisibility(score, false)
    expect(score.tracks[0].staves[0].showStandardNotation).toBe(false)
    expect(score.tracks[1].staves[0].showStandardNotation).toBe(true)
  })
})
