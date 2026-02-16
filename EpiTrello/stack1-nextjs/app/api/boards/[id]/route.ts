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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use admin client to bypass RLS so shared members can access
    const supabaseAdmin = getSupabaseAdmin()

    const { data: board, error: boardError } = await supabaseAdmin
      .from('boards')
      .select('*')
      .eq('id', params.id)
      .single()

    if (boardError || !board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    // Verify user has access: is owner OR is a member
    const isOwner = board.owner_id === user.id
    if (!isOwner) {
      const { data: membership } = await supabaseAdmin
        .from('board_members')
        .select('id, role')
        .eq('board_id', params.id)
        .eq('user_id', user.id)
        .maybeSingle()

      // Also check if user has an accepted invitation
      const { data: invitation } = await supabaseAdmin
        .from('board_invitations')
        .select('id')
        .eq('board_id', params.id)
        .eq('invitee_id', user.id)
        .eq('status', 'accepted')
        .maybeSingle()

      if (!membership && !invitation) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    const { data: lists, error: listsError } = await supabaseAdmin
      .from('lists')
      .select('*')
      .eq('board_id', params.id)
      .order('position', { ascending: true })

    if (listsError) throw listsError

    const listsWithCards = await Promise.all(
      (lists || []).map(async (list) => {
        const { data: cards, error: cardsError } = await supabaseAdmin
          .from('cards')
          .select('*')
          .eq('list_id', list.id)
          .order('position', { ascending: true })

        if (cardsError) throw cardsError

        const cardsWithGitHub = await Promise.all(
          (cards || []).map(async (card) => {
            const { data: githubLinks, error: linksError } = await supabaseAdmin
              .from('card_github_links')
              .select('*')
              .eq('card_id', card.id)

            if (linksError) throw linksError

            // Fetch card assignments with profile data
            const { data: assignments } = await supabaseAdmin
              .from('card_assignments')
              .select('*')
              .eq('card_id', card.id)
              .order('assigned_at', { ascending: true })

            const enrichedAssignments = await Promise.all(
              (assignments || []).map(async (a) => {
                const { data: profile } = await supabaseAdmin
                  .from('profiles')
                  .select('username, avatar_url')
                  .eq('id', a.user_id)
                  .single()
                return {
                  ...a,
                  username: profile?.username || 'Unknown',
                  avatar_url: profile?.avatar_url || null,
                }
              })
            )

            // Fetch card images
            const { data: cardImages } = await supabaseAdmin
              .from('card_images')
              .select('*')
              .eq('card_id', card.id)
              .order('position', { ascending: true })

            // Fetch comment count
            const { count: commentCount } = await supabaseAdmin
              .from('card_comments')
              .select('*', { count: 'exact', head: true })
              .eq('card_id', card.id)

            return {
              ...card,
              github_links: githubLinks || [],
              github_links_count: githubLinks?.length || 0,
              assignments: enrichedAssignments,
              images: cardImages || [],
              comment_count: commentCount || 0,
            }
          })
        )

        return {
          ...list,
          cards: cardsWithGitHub
        }
      })
    )

    const result = {
      ...board,
      lists: listsWithCards
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching board:', error)
    return NextResponse.json(
      { error: 'Failed to fetch board' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if the user is the owner or a member of this board
    const supabaseAdmin = getSupabaseAdmin()

    const { data: board } = await supabaseAdmin
      .from('boards')
      .select('owner_id')
      .eq('id', params.id)
      .single()

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    const isOwner = board.owner_id === user.id

    if (!isOwner) {
      const { data: membership } = await supabaseAdmin
        .from('board_members')
        .select('id')
        .eq('board_id', params.id)
        .eq('user_id', user.id)
        .maybeSingle()

      const { data: invitation } = await supabaseAdmin
        .from('board_invitations')
        .select('id')
        .eq('board_id', params.id)
        .eq('invitee_id', user.id)
        .eq('status', 'accepted')
        .maybeSingle()

      if (!membership && !invitation) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { title, description } = body

    // Use admin client to bypass RLS for authorized members
    const { data, error } = await supabaseAdmin
      .from('boards')
      .update({ title, description, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating board:', error)
    return NextResponse.json(
      { error: 'Failed to update board' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', params.id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Board not found or access denied' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting board:', error)
    return NextResponse.json(
      { error: 'Failed to delete board' },
      { status: 500 }
    )
  }
}
