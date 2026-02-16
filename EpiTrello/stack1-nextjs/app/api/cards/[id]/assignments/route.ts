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

// GET: Get all assignments for a card
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
    const cardId = params.id

    const { data: assignments, error } = await supabaseAdmin
      .from('card_assignments')
      .select('*')
      .eq('card_id', cardId)
      .order('assigned_at', { ascending: true })

    if (error) throw error

    // Enrich with profile data
    const enriched = await Promise.all(
      (assignments || []).map(async (assignment) => {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', assignment.user_id)
          .single()

        return {
          ...assignment,
          username: profile?.username || 'Unknown',
          avatar_url: profile?.avatar_url || null,
        }
      })
    )

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Error fetching card assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}

// POST: Toggle assignment (assign or unassign a user)
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

    const supabaseAdmin = getSupabaseAdmin()
    const cardId = params.id
    const { user_id } = await request.json()

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    // Check if assignment already exists
    const { data: existing } = await supabaseAdmin
      .from('card_assignments')
      .select('id')
      .eq('card_id', cardId)
      .eq('user_id', user_id)
      .maybeSingle()

    if (existing) {
      // Unassign
      const { error: deleteError } = await supabaseAdmin
        .from('card_assignments')
        .delete()
        .eq('card_id', cardId)
        .eq('user_id', user_id)

      if (deleteError) throw deleteError

      // Return updated assignments list
      const { data: assignments } = await supabaseAdmin
        .from('card_assignments')
        .select('*')
        .eq('card_id', cardId)
        .order('assigned_at', { ascending: true })

      const enriched = await Promise.all(
        (assignments || []).map(async (a) => {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', a.user_id)
            .single()
          return { ...a, username: profile?.username || 'Unknown', avatar_url: profile?.avatar_url || null }
        })
      )

      return NextResponse.json({ action: 'unassigned', assignments: enriched })
    } else {
      // Assign
      const { error: insertError } = await supabaseAdmin
        .from('card_assignments')
        .insert({
          card_id: cardId,
          user_id: user_id,
          assigned_by: user.id,
        })

      if (insertError) throw insertError

      // Return updated assignments list
      const { data: assignments } = await supabaseAdmin
        .from('card_assignments')
        .select('*')
        .eq('card_id', cardId)
        .order('assigned_at', { ascending: true })

      const enriched = await Promise.all(
        (assignments || []).map(async (a) => {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', a.user_id)
            .single()
          return { ...a, username: profile?.username || 'Unknown', avatar_url: profile?.avatar_url || null }
        })
      )

      return NextResponse.json({ action: 'assigned', assignments: enriched })
    }
  } catch (error) {
    console.error('Error toggling card assignment:', error)
    return NextResponse.json(
      { error: 'Failed to toggle assignment' },
      { status: 500 }
    )
  }
}
