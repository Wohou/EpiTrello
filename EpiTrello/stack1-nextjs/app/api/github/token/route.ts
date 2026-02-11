import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { requireAuth, getGitHubToken } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

/**
 * GET /api/github/token
 * Returns the GitHub provider token from the user's session
 * This token is needed to call GitHub API endpoints
 */
export async function GET() {
    try {
        const supabase = createRouteHandlerClient({ cookies })

        const { user, error } = await requireAuth(supabase)
        if (error) return error

        const token = await getGitHubToken(supabase)

        if (!token) {
            return NextResponse.json(
                { error: 'GitHub token missing, please reconnect', needsReauth: true },
                { status: 403 }
            )
        }

        return NextResponse.json({
            token,
            username: user.user_metadata?.user_name,
        })
    } catch (error) {
        console.error('Error getting GitHub token:', error)
        const message = error instanceof Error ? error.message : 'Failed to get token'
        return NextResponse.json(
            { error: message },
            { status: 500 }
        )
    }
}
