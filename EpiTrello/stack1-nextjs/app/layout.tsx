import type { Metadata } from 'next'
import './globals.css'
import CursorGlow from '@/components/CursorGlow'
import { ThemeProvider } from '@/lib/theme-context'

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
        <ThemeProvider>
          <CursorGlow />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
