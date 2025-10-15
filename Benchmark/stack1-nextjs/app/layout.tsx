import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EpiTrello - Stack 1 (Next.js + Supabase)',
  description: 'Trello-like task management application built with Next.js and Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
