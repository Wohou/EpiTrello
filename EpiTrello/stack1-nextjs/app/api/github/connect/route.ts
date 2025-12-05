import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Verify GitHub connection and get provider token
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: identitiesData } = await supabase.auth.getUserIdentities()
    const identities = identitiesData?.identities ?? []
    const githubIdentity = identities.find((identity: any) => identity.provider === 'github')

    if (!githubIdentity) {
      return NextResponse.json(
        { needsLinking: true },
        { status: 200 }
      )
    }

    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.provider_token && !session?.provider_refresh_token) {
      return NextResponse.json(
        { needsReauth: true },
        { status: 200 }
      )
    }

    const accessToken = session.provider_token

    if (!accessToken) {
      return NextResponse.json(
        { needsReauth: true },
        { status: 200 }
      )
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (!userResponse.ok) {
      return NextResponse.json(
        { needsReauth: true },
        { status: 200 }
      )
    }

    return NextResponse.json({
      success: true,
      hasToken: true,
    })
  } catch (error: any) {
    console.error('Error connecting GitHub:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to connect GitHub' },
      { status: 500 }
    )
  }
}

// Disconnect GitHub from user account
export async function DELETE() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: identitiesData } = await supabase.auth.getUserIdentities()
    const identities = identitiesData?.identities ?? []
    const githubIdentity = identities.find((identity: any) => identity.provider === 'github')

    if (githubIdentity) {
      const { error: unlinkError } = await supabase.auth.unlinkIdentity(githubIdentity)

      if (unlinkError) {
        throw unlinkError
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        github_username: null,
        github_connected_at: null,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error disconnecting GitHub:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to disconnect GitHub' },
      { status: 500 }
    )
  }
}

// Check if user has GitHub provider linked
export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: identitiesData } = await supabase.auth.getUserIdentities()
    const identities = identitiesData?.identities ?? []
    const githubIdentity = identities.find((identity: any) => identity.provider === 'github')

    const { data: profile } = await supabase
      .from('profiles')
      .select('github_username, github_connected_at')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      connected: !!githubIdentity,
      github_username: profile?.github_username || githubIdentity?.identity_data?.user_name,
      connected_at: profile?.github_connected_at,
    })
  } catch (error: any) {
    console.error('Error getting GitHub status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get GitHub status' },
      { status: 500 }
    )
  }
}
