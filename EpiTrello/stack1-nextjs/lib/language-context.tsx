'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabaseBrowser } from './supabase-browser'
import { translations, type Language } from './translations'

export type { Language }

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => Promise<void>
  t: typeof translations.fr
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setCurrentLanguage] = useState<Language>('fr')

  useEffect(() => {
    // Load language from user metadata
    const loadLanguage = async () => {
      const { data: { user } } = await supabaseBrowser.auth.getUser()
      if (user?.user_metadata?.language) {
        setCurrentLanguage(user.user_metadata.language as Language)
      } else {
        // Detect browser language
        const browserLang = navigator.language.split('-')[0]
        if (browserLang === 'fr' || browserLang === 'en') {
          setCurrentLanguage(browserLang as Language)
        }
      }
    }
    loadLanguage()
  }, [])

  const setLanguage = async (lang: Language) => {
    setCurrentLanguage(lang)
    
    // Save language to user metadata
    try {
      await supabaseBrowser.auth.updateUser({
        data: { language: lang }
      })
    } catch (error) {
      console.error('Error saving language:', error)
    }
  }

  const t = translations[language]

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
