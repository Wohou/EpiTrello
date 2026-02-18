import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET: Get all members of a board
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

    const boardId = params.id

    // Check if user has access to this board
    const { data: board } = await supabase
      .from('boards')
      .select('owner_id')
      .eq('id', boardId)
      .single()

    const { data: memberCheck } = await supabase
      .from('board_members')
      .select('id')
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!board && !memberCheck) {
      return NextResponse.json(
        { error: 'Board not found or no access' },
        { status: 404 }
      )
    }

    // Get all members
    const { data: members, error } = await supabase
      .from('board_members')
      .select('*')
      .eq('board_id', boardId)
      .order('joined_at', { ascending: true })

    if (error) throw error

    // Try to get usernames from profiles table
    const enrichedMembers = await Promise.all(
      (members || []).map(async (member) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', member.user_id)
          .single()

        return {
          ...member,
          username: profile?.username || 'Utilisateur',
          avatar_url: profile?.avatar_url || null
        }
      })
    )

    // Include the board owner if not already in the members list
    if (board) {
      const ownerInMembers = enrichedMembers.some(m => m.user_id === board.owner_id)
      if (!ownerInMembers) {
        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', board.owner_id)
          .single()

        enrichedMembers.unshift({
          id: 'owner-' + board.owner_id,
          board_id: boardId,
          user_id: board.owner_id,
          role: 'owner',
          joined_at: new Date().toISOString(),
          username: ownerProfile?.username || 'Owner',
          avatar_url: ownerProfile?.avatar_url || null,
        })
      }
    }

    return NextResponse.json(enrichedMembers)
  } catch (error) {
    console.error('Error fetching board members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch board members' },
      { status: 500 }
    )
  }
}

// DELETE: Remove a member from the board (by owner) or leave the board (by member)
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

    const boardId = params.id
    const { searchParams } = new URL(request.url)
    // const memberId = searchParams.get('memberId')
    const userId = searchParams.get('userId')

    // Get board info
    const { data: board } = await supabase
      .from('boards')
      .select('owner_id')
      .eq('id', boardId)
      .single()

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    const isOwner = board.owner_id === user.id

    // If userId is provided, it's a revoke action by owner
    if (userId) {
      if (!isOwner) {
        return NextResponse.json(
          { error: 'Only board owner can remove members' },
          { status: 403 }
        )
      }

      // Can't remove the owner
      if (userId === board.owner_id) {
        return NextResponse.json(
          { error: 'Cannot remove the board owner' },
          { status: 400 }
        )
      }

      const { error: deleteError } = await supabase
        .from('board_members')
        .delete()
        .eq('board_id', boardId)
        .eq('user_id', userId)

      if (deleteError) throw deleteError

      return NextResponse.json({ success: true })
    }

    // If no userId, it's a leave action by current user
    if (isOwner) {
      return NextResponse.json(
        { error: 'Owner cannot leave the board. Delete the board instead.' },
        { status: 400 }
      )
    }

    const { error: deleteError } = await supabase
      .from('board_members')
      .delete()
      .eq('board_id', boardId)
      .eq('user_id', user.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing board member:', error)
    return NextResponse.json(
      { error: 'Failed to remove board member' },
      { status: 500 }
    )
  }
}
