import { NextResponse } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Check if user is authenticated and return user object
 * Returns NextResponse with 401 if not authenticated
 */
export async function requireAuth(supabase: SupabaseClient) {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return {
            user: null,
            error: NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }
    }

    return { user, error: null }
}

/**
 * Get GitHub identity for current user
 */
export async function getGitHubIdentity(supabase: SupabaseClient) {
    const { data: identitiesData } = await supabase.auth.getUserIdentities()
    const identities = identitiesData?.identities ?? []
    return identities.find((identity: { provider: string }) => identity.provider === 'github')
}

/**
 * Get GitHub access token from session
 */
export async function getGitHubToken(supabase: SupabaseClient) {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.provider_token || null
}
