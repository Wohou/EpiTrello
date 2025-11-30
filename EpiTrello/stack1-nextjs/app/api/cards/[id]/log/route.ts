import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the card with creator and modifier info
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('id, created_by, last_modified_by, created_at, updated_at')
      .eq('id', params.id)
      .single()

    if (cardError) throw cardError

    // Get usernames from profiles
    const userIds = [card.created_by, card.last_modified_by].filter(Boolean)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || [])

    return NextResponse.json({
      created_by: card.created_by,
      created_by_username: profileMap.get(card.created_by) || 'Utilisateur',
      created_at: card.created_at,
      last_modified_by: card.last_modified_by,
      last_modified_by_username: profileMap.get(card.last_modified_by) || 'Utilisateur',
      updated_at: card.updated_at
    })
  } catch (error) {
    console.error('Error fetching card log:', error)
    return NextResponse.json(
      { error: 'Failed to fetch card log' },
      { status: 500 }
    )
  }
}
