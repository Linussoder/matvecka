'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  setTheme: () => {}
})

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage on mount
  useEffect(() => {
    setMounted(true)

    // Check localStorage first
    const savedTheme = localStorage.getItem('theme')

    if (savedTheme === 'dark') {
      setIsDark(true)
      applyDarkMode(true)
    } else if (savedTheme === 'light') {
      setIsDark(false)
      applyDarkMode(false)
    } else {
      // No saved preference - default to light
      setIsDark(false)
      applyDarkMode(false)
    }
  }, [])

  // Apply dark mode to document
  function applyDarkMode(dark) {
    if (typeof window === 'undefined') return

    const html = document.documentElement

    if (dark) {
      html.classList.add('dark')
      html.style.colorScheme = 'dark'
    } else {
      html.classList.remove('dark')
      html.style.colorScheme = 'light'
    }
  }

  // Update document class when theme changes
  useEffect(() => {
    if (!mounted) return

    applyDarkMode(isDark)
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark, mounted])

  const toggleTheme = () => {
    setIsDark(prev => !prev)
  }

  const setTheme = (dark) => {
    setIsDark(dark)
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
