import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    await supabase.auth.exchangeCodeForSession(code)

    // Sync user metadata (avatar_url, username) to profiles table
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const avatar_url = user.user_metadata?.avatar_url || null
      const username = user.user_metadata?.username || user.email?.split('@')[0] || null
      await supabase
        .from('profiles')
        .upsert(
          { id: user.id, avatar_url, username },
          { onConflict: 'id' }
        )
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(new URL('/boards', request.url))
}
