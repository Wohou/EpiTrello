import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Skip middleware for auth callback (OAuth return) and debug page
  if (req.nextUrl.pathname === '/auth/callback' || req.nextUrl.pathname === '/debug-auth') {
    return res
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirect authenticated users away from auth page
  if (session && req.nextUrl.pathname === '/auth') {
    return NextResponse.redirect(new URL('/boards', req.url))
  }

  // Redirect unauthenticated users to auth page
  if (!session && req.nextUrl.pathname.startsWith('/boards')) {
    return NextResponse.redirect(new URL('/auth', req.url))
  }

  return res
}

export const config = {
  matcher: ['/auth', '/boards/:path*', '/api/:path*', '/auth/callback'],
}
