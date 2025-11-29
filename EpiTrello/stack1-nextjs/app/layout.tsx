import type { Metadata } from 'next'
import './globals.css'
import CursorGlow from '@/components/CursorGlow'
import { ThemeProvider } from '@/lib/theme-context'
import { LanguageProvider } from '@/lib/language-context'

export const metadata: Metadata = {
  title: 'EpiTrello',
  description: 'Trello-like task management application built with Next.js and Supabase',
  icons: {
    icon: '/logo.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <ThemeProvider>
            <CursorGlow />
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
