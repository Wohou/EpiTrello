import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET: List activity for a card (reverse chronological)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: activities, error } = await supabaseAdmin
      .from('card_activity')
      .select('*')
      .eq('card_id', params.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    // Enrich with user profiles
    const userIds = [...new Set((activities || []).map(a => a.user_id))]
    const profileMap = new Map<string, { username: string; avatar_url: string | null }>()

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds)

      for (const p of (profiles || [])) {
        profileMap.set(p.id, { username: p.username || 'Unknown', avatar_url: p.avatar_url })
      }
    }

    const enriched = (activities || []).map(activity => ({
      ...activity,
      username: profileMap.get(activity.user_id)?.username || 'Unknown',
      avatar_url: profileMap.get(activity.user_id)?.avatar_url || null,
    }))

    return NextResponse.json({ activities: enriched })
  } catch (error) {
    console.error('Error fetching card activity:', error)
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
  }
}

// POST: Log a new activity entry (called from other API routes or client)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action_type, action_data } = await request.json()

    if (!action_type) {
      return NextResponse.json({ error: 'action_type is required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    const { data: activity, error } = await supabaseAdmin
      .from('card_activity')
      .insert({
        card_id: params.id,
        user_id: user.id,
        action_type,
        action_data: action_data || {},
      })
      .select()
      .single()

    if (error) throw error

    // Get profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      activity: {
        ...activity,
        username: profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url || null,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}
