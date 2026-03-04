import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTheme } from './useTheme'

beforeEach(() => {
  localStorage.clear()
  // Ensure #root exists (happy-dom doesn't create it from index.html)
  let root = document.getElementById('root')
  if (!root) {
    root = document.createElement('div')
    root.id = 'root'
    document.body.appendChild(root)
  }
  root.removeAttribute('data-theme')
})

describe('useTheme', () => {
  it('defaults to light theme', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')
  })

  it('toggles to dark-chrome and back', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark-chrome')
    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
  })

  it('sets data-theme attribute on root element', () => {
    const root = document.getElementById('root')
    const { result } = renderHook(() => useTheme())
    expect(root?.getAttribute('data-theme')).toBeNull()
    act(() => result.current.toggleTheme())
    expect(root?.getAttribute('data-theme')).toBe('dark-chrome')
    act(() => result.current.toggleTheme())
    expect(root?.getAttribute('data-theme')).toBeNull()
  })

  it('persists theme to localStorage', () => {
    const { result } = renderHook(() => useTheme())
    act(() => result.current.toggleTheme())
    expect(localStorage.getItem('riff-diff-theme')).toBe('dark-chrome')
  })

  it('restores theme from localStorage', () => {
    localStorage.setItem('riff-diff-theme', 'dark-chrome')
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark-chrome')
  })
})
