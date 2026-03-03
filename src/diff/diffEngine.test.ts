import { describe, it, expect } from 'vitest'
import type { model } from '@coderline/alphatab'

type Score = model.Score
type Beat = model.Beat
import { beatSignature, diffScores } from './diffEngine'

// ---------------------------------------------------------------------------
// Mock Builders
// ---------------------------------------------------------------------------

function mockNote(overrides: Partial<{
  string: number
  fret: number
  isPercussion: boolean
  percussionArticulation: number
}> = {}): unknown {
  return {
    string: 1,
    fret: 0,
    isPercussion: false,
    percussionArticulation: 0,
    ...overrides,
  }
}

function mockBeat(overrides: Partial<{
  duration: number
  notes: unknown[]
  dots: number
  isRest: boolean
  hasTuplet: boolean
  tupletNumerator: number
  tupletDenominator: number
}> = {}): unknown {
  return {
    duration: 4,
    notes: [],
    dots: 0,
    isRest: false,
    hasTuplet: false,
    tupletNumerator: 1,
    tupletDenominator: 1,
    ...overrides,
  }
}

function mockScore(config: {
  measures: {
    beats: unknown[]
    tempo?: number
    timeSigNum?: number
    timeSigDenom?: number
  }[]
  tempo?: number
}): unknown {
  const masterBars = config.measures.map((m, i) => ({
    timeSignatureNumerator: m.timeSigNum ?? 4,
    timeSignatureDenominator: m.timeSigDenom ?? 4,
    tempoAutomations: m.tempo != null
      ? [{ value: m.tempo, type: 0, ratioPosition: 0, isLinear: false, text: '' }]
      : [],
    index: i,
    previousMasterBar: null as unknown,
  }))

  for (let i = 1; i < masterBars.length; i++) {
    masterBars[i].previousMasterBar = masterBars[i - 1]
  }

  const bars = config.measures.map((m, i) => ({
    index: i,
    voices: [{
      beats: m.beats,
      isEmpty: m.beats.length === 0,
    }],
  }))

  return {
    masterBars,
    tracks: [{
      index: 0,
      staves: [{ bars }],
    }],
    tempo: config.tempo ?? 120,
  }
}

// ---------------------------------------------------------------------------
// beatSignature tests
// ---------------------------------------------------------------------------

describe('beatSignature', () => {
  it('produces same signature for identical beats', () => {
    const a = mockBeat({ duration: 4, notes: [mockNote({ string: 3, fret: 5 })] })
    const b = mockBeat({ duration: 4, notes: [mockNote({ string: 3, fret: 5 })] })
    expect(beatSignature(a as Beat)).toBe(beatSignature(b as Beat))
  })

  it('produces different signature when fret differs', () => {
    const a = mockBeat({ duration: 4, notes: [mockNote({ string: 3, fret: 5 })] })
    const b = mockBeat({ duration: 4, notes: [mockNote({ string: 3, fret: 7 })] })
    expect(beatSignature(a as Beat)).not.toBe(beatSignature(b as Beat))
  })

  it('produces different signature when duration differs', () => {
    const a = mockBeat({ duration: 4, notes: [mockNote({ string: 1, fret: 5 })] })
    const b = mockBeat({ duration: 8, notes: [mockNote({ string: 1, fret: 5 })] })
    expect(beatSignature(a as Beat)).not.toBe(beatSignature(b as Beat))
  })

  it('produces same signature for rest beats with same duration', () => {
    const a = mockBeat({ duration: 4, isRest: true })
    const b = mockBeat({ duration: 4, isRest: true })
    expect(beatSignature(a as Beat)).toBe(beatSignature(b as Beat))
  })

  it('note order does not affect signature', () => {
    const a = mockBeat({
      duration: 4,
      notes: [mockNote({ string: 1, fret: 5 }), mockNote({ string: 3, fret: 7 })],
    })
    const b = mockBeat({
      duration: 4,
      notes: [mockNote({ string: 3, fret: 7 }), mockNote({ string: 1, fret: 5 })],
    })
    expect(beatSignature(a as Beat)).toBe(beatSignature(b as Beat))
  })
})

// ---------------------------------------------------------------------------
// diffScores tests
// ---------------------------------------------------------------------------

describe('diffScores', () => {
  describe('identical scores', () => {
    it('marks all beats as equal when scores are identical', () => {
      const score = mockScore({
        measures: [
          { beats: [mockBeat({ duration: 4, notes: [mockNote({ string: 3, fret: 5 })] })] },
          { beats: [mockBeat({ duration: 4, notes: [mockNote({ string: 3, fret: 5 })] })] },
        ],
      })
      const result = diffScores(score as Score, score as Score, 0, 0)

      expect(result.measures).toHaveLength(2)
      expect(result.measures.every(m => m.beatDiffs.every(bd => bd.status === 'equal'))).toBe(true)
      expect(result.summary.equal).toBe(2)
      expect(result.summary.added).toBe(0)
      expect(result.summary.removed).toBe(0)
      expect(result.summary.changed).toBe(0)
      expect(result.summary.totalMeasures).toBe(2)
    })
  })

  describe('measure count differences', () => {
    it('marks extra measures in score B as added', () => {
      const scoreA = mockScore({
        measures: [
          { beats: [mockBeat({ duration: 4, notes: [mockNote({ string: 1, fret: 0 })] })] },
        ],
      })
      const scoreB = mockScore({
        measures: [
          { beats: [mockBeat({ duration: 4, notes: [mockNote({ string: 1, fret: 0 })] })] },
          { beats: [mockBeat({ duration: 4, notes: [mockNote({ string: 2, fret: 3 })] })] },
        ],
      })
      const result = diffScores(scoreA as Score, scoreB as Score, 0, 0)

      expect(result.measures).toHaveLength(2)
      expect(result.measures[0].beatDiffs[0].status).toBe('equal')
      expect(result.measures[1].beatDiffs[0].status).toBe('added')
      expect(result.summary.added).toBe(1)
      expect(result.summary.totalMeasures).toBe(2)
    })

    it('marks extra measures in score A as removed', () => {
      const scoreA = mockScore({
        measures: [
          { beats: [mockBeat({ duration: 4, notes: [mockNote({ string: 1, fret: 0 })] })] },
          { beats: [mockBeat({ duration: 4, notes: [mockNote({ string: 2, fret: 3 })] })] },
        ],
      })
      const scoreB = mockScore({
        measures: [
          { beats: [mockBeat({ duration: 4, notes: [mockNote({ string: 1, fret: 0 })] })] },
        ],
      })
      const result = diffScores(scoreA as Score, scoreB as Score, 0, 0)

      expect(result.measures).toHaveLength(2)
      expect(result.measures[0].beatDiffs[0].status).toBe('equal')
      expect(result.measures[1].beatDiffs[0].status).toBe('removed')
      expect(result.summary.removed).toBe(1)
    })
  })

  describe('note-level changes', () => {
    it('marks beat as changed with noteDiffs when a fret differs', () => {
      const scoreA = mockScore({
        measures: [
          { beats: [mockBeat({ duration: 4, notes: [mockNote({ string: 3, fret: 5 })] })] },
        ],
      })
      const scoreB = mockScore({
        measures: [
          { beats: [mockBeat({ duration: 4, notes: [mockNote({ string: 3, fret: 7 })] })] },
        ],
      })
      const result = diffScores(scoreA as Score, scoreB as Score, 0, 0)

      expect(result.measures[0].beatDiffs[0].status).toBe('changed')
      const noteDiffs = result.measures[0].beatDiffs[0].noteDiffs!
      expect(noteDiffs).toBeDefined()
      expect(noteDiffs.some(nd => nd.status === 'noteRemoved')).toBe(true)
      expect(noteDiffs.some(nd => nd.status === 'noteAdded')).toBe(true)
      expect(result.summary.changed).toBe(1)
    })
  })

  describe('tempo differences', () => {
    it('detects tempo change on a measure', () => {
      const scoreA = mockScore({
        measures: [
          { beats: [mockBeat({ duration: 4, notes: [mockNote({ string: 1, fret: 0 })] })], tempo: 120 },
        ],
      })
      const scoreB = mockScore({
        measures: [
          { beats: [mockBeat({ duration: 4, notes: [mockNote({ string: 1, fret: 0 })] })], tempo: 140 },
        ],
      })
      const result = diffScores(scoreA as Score, scoreB as Score, 0, 0)

      expect(result.measures[0].tempoDiff).not.toBeNull()
      expect(result.measures[0].tempoDiff!.tempoA).toBe(120)
      expect(result.measures[0].tempoDiff!.tempoB).toBe(140)
      expect(result.measures[0].timeSigDiff).toBeNull()
      expect(result.summary.tempoChanges).toBe(1)
    })
  })

  describe('time signature differences', () => {
    it('detects time signature change on a measure', () => {
      const scoreA = mockScore({
        measures: [
          { beats: [mockBeat({ duration: 4, notes: [mockNote({ string: 1, fret: 0 })] })], timeSigNum: 4, timeSigDenom: 4 },
        ],
      })
      const scoreB = mockScore({
        measures: [
          { beats: [mockBeat({ duration: 4, notes: [mockNote({ string: 1, fret: 0 })] })], timeSigNum: 3, timeSigDenom: 4 },
        ],
      })
      const result = diffScores(scoreA as Score, scoreB as Score, 0, 0)

      expect(result.measures[0].timeSigDiff).not.toBeNull()
      expect(result.measures[0].timeSigDiff!.sigA).toBe('4/4')
      expect(result.measures[0].timeSigDiff!.sigB).toBe('3/4')
      expect(result.summary.timeSigChanges).toBe(1)
    })
  })

  describe('edge cases', () => {
    it('handles empty measures without crash', () => {
      const scoreA = mockScore({ measures: [{ beats: [] }] })
      const scoreB = mockScore({ measures: [{ beats: [] }] })
      const result = diffScores(scoreA as Score, scoreB as Score, 0, 0)

      expect(result.measures).toHaveLength(1)
      expect(result.measures[0].beatDiffs).toHaveLength(0)
    })

    it('handles scores with no measures', () => {
      const scoreA = mockScore({ measures: [] })
      const scoreB = mockScore({ measures: [] })
      const result = diffScores(scoreA as Score, scoreB as Score, 0, 0)

      expect(result.measures).toHaveLength(0)
      expect(result.summary.totalMeasures).toBe(0)
    })
  })

  describe('summary accumulation', () => {
    it('summary counts match actual beat diffs across all measures', () => {
      const scoreA = mockScore({
        measures: [
          {
            beats: [
              mockBeat({ duration: 4, notes: [mockNote({ string: 1, fret: 0 })] }),
              mockBeat({ duration: 4, notes: [mockNote({ string: 2, fret: 3 })] }),
            ],
          },
          {
            beats: [
              mockBeat({ duration: 4, notes: [mockNote({ string: 1, fret: 5 })] }),
            ],
          },
        ],
      })
      const scoreB = mockScore({
        measures: [
          {
            beats: [
              mockBeat({ duration: 4, notes: [mockNote({ string: 1, fret: 0 })] }),
              mockBeat({ duration: 4, notes: [mockNote({ string: 2, fret: 5 })] }),
            ],
          },
          {
            beats: [
              mockBeat({ duration: 4, notes: [mockNote({ string: 1, fret: 5 })] }),
              mockBeat({ duration: 8, notes: [mockNote({ string: 3, fret: 7 })] }),
            ],
          },
        ],
      })
      const result = diffScores(scoreA as Score, scoreB as Score, 0, 0)

      let equal = 0, added = 0, removed = 0, changed = 0
      for (const m of result.measures) {
        for (const bd of m.beatDiffs) {
          if (bd.status === 'equal') equal++
          if (bd.status === 'added') added++
          if (bd.status === 'removed') removed++
          if (bd.status === 'changed') changed++
        }
      }

      expect(result.summary.equal).toBe(equal)
      expect(result.summary.added).toBe(added)
      expect(result.summary.removed).toBe(removed)
      expect(result.summary.changed).toBe(changed)
    })
  })

  describe('percussion', () => {
    it('uses percussion articulation in signature', () => {
      const scoreA = mockScore({
        measures: [
          { beats: [mockBeat({ duration: 4, notes: [mockNote({ isPercussion: true, percussionArticulation: 42 })] })] },
        ],
      })
      const scoreB = mockScore({
        measures: [
          { beats: [mockBeat({ duration: 4, notes: [mockNote({ isPercussion: true, percussionArticulation: 38 })] })] },
        ],
      })
      const result = diffScores(scoreA as Score, scoreB as Score, 0, 0)

      expect(result.measures[0].beatDiffs[0].status).toBe('changed')
    })
  })
})
