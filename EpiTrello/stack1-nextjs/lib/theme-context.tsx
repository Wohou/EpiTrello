'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabaseBrowser } from './supabase-browser'
import { themes, type ThemeKey } from './themes'

interface ThemeContextType {
  currentTheme: ThemeKey
  setTheme: (theme: ThemeKey) => Promise<void>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('default')

  useEffect(() => {
    // Load theme from user metadata
    const loadTheme = async () => {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (user?.user_metadata?.theme) {
        setCurrentTheme(user.user_metadata.theme as ThemeKey)
      }
    }
    loadTheme()
  }, [])

  useEffect(() => {
    // Apply theme to document
    const theme = themes[currentTheme]
    document.documentElement.style.setProperty('--background', theme.background)
    document.documentElement.style.setProperty('--primary-color', theme.primary)
    document.documentElement.style.setProperty('--secondary-color', theme.secondary)
    document.documentElement.style.setProperty('--accent-color', theme.accent)
  }, [currentTheme])

  const setTheme = async (theme: ThemeKey) => {
    setCurrentTheme(theme)
    
    // Save theme to user metadata
    try {
      await supabaseBrowser.auth.updateUser({
        data: { theme }
      })
    } catch (error) {
      console.error('Error saving theme:', error)
    }
  }

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
