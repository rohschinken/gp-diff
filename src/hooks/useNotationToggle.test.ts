import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNotationToggle } from './useNotationToggle'

beforeEach(() => {
  localStorage.clear()
})

describe('useNotationToggle', () => {
  it('defaults to true (notation shown)', () => {
    const { result } = renderHook(() => useNotationToggle())
    expect(result.current.showNotation).toBe(true)
  })

  it('toggles to false and back', () => {
    const { result } = renderHook(() => useNotationToggle())
    act(() => result.current.toggleNotation())
    expect(result.current.showNotation).toBe(false)
    act(() => result.current.toggleNotation())
    expect(result.current.showNotation).toBe(true)
  })

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useNotationToggle())
    act(() => result.current.toggleNotation())
    expect(localStorage.getItem('riff-diff-show-notation')).toBe('false')
    act(() => result.current.toggleNotation())
    expect(localStorage.getItem('riff-diff-show-notation')).toBe('true')
  })

  it('restores from localStorage', () => {
    localStorage.setItem('riff-diff-show-notation', 'false')
    const { result } = renderHook(() => useNotationToggle())
    expect(result.current.showNotation).toBe(false)
  })

  it('defaults to true for invalid localStorage value', () => {
    localStorage.setItem('riff-diff-show-notation', 'garbage')
    const { result } = renderHook(() => useNotationToggle())
    expect(result.current.showNotation).toBe(true)
  })
})
