import { useState, useCallback, useEffect } from 'react'

export type Theme = 'light' | 'dark-chrome'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('riff-diff-theme')
    return stored === 'dark-chrome' ? 'dark-chrome' : 'light'
  })

  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    if (theme === 'dark-chrome') {
      root.setAttribute('data-theme', 'dark-chrome')
    } else {
      root.removeAttribute('data-theme')
    }
    localStorage.setItem('riff-diff-theme', theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark-chrome' : 'light'))
  }, [])

  return { theme, toggleTheme }
}
