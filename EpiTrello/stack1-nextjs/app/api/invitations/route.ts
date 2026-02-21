import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notifyBoardInvitation } from '@/lib/email-service'

// GET: Fetch all invitations for the current user
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

    // Get pending invitations for the current user with board and inviter info
    const { data: invitations, error } = await supabase
      .from('board_invitations')
      .select(`
        *,
        boards:board_id (
          id,
          title
        )
      `)
      .eq('invitee_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get inviter usernames from auth.users metadata
    // const inviterIds = [...new Set(invitations?.map(inv => inv.inviter_id) || [])]

    const enrichedInvitations = await Promise.all(
      (invitations || []).map(async (invitation) => {
        // Try to get inviter info from profiles or user metadata
        const { data: inviterData } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', invitation.inviter_id)
          .single()

        return {
          ...invitation,
          board_title: invitation.boards?.title,
          inviter_username: inviterData?.username || 'Utilisateur'
        }
      })
    )

    return NextResponse.json(enrichedInvitations)
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    )
  }
}

// POST: Create a new invitation
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

    const body = await request.json()
    const { board_id, invitee_id } = body

    if (!board_id || !invitee_id) {
      return NextResponse.json(
        { error: 'board_id and invitee_id are required' },
        { status: 400 }
      )
    }

    // Check if the user is the board owner
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('owner_id')
      .eq('id', board_id)
      .single()

    if (boardError || !board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    if (board.owner_id !== user.id) {
      return NextResponse.json(
        { error: 'Only board owner can invite users' },
        { status: 403 }
      )
    }

    // Check if invitee is not the owner
    if (invitee_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot invite yourself' },
        { status: 400 }
      )
    }

    // Verify that the invitee exists
    const { data: inviteeProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', invitee_id)
      .maybeSingle()

    if (!inviteeProfile) {
      return NextResponse.json(
        { error: 'User not found. Please check the user ID.' },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('board_members')
      .select('id')
      .eq('board_id', board_id)
      .eq('user_id', invitee_id)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this board' },
        { status: 400 }
      )
    }

    // Check if there's already an invitation (pending, declined, or accepted)
    const { data: existingInvitation } = await supabase
      .from('board_invitations')
      .select('id, status')
      .eq('board_id', board_id)
      .eq('invitee_id', invitee_id)
      .maybeSingle()

    if (existingInvitation) {
      if (existingInvitation.status === 'pending') {
        return NextResponse.json(
          { error: 'An invitation is already pending for this user' },
          { status: 400 }
        )
      }

      // If there's a declined or old invitation, update it to pending
      const { data: updatedInvitation, error: updateError } = await supabase
        .from('board_invitations')
        .update({
          status: 'pending',
          inviter_id: user.id,
          created_at: new Date().toISOString(),
          responded_at: null
        })
        .eq('id', existingInvitation.id)
        .select()

      if (updateError) throw updateError

      // Send email notification
      notifyBoardInvitation(board_id, invitee_id, user.id).catch(err =>
        console.error('Failed to send invitation notification:', err)
      )

      return NextResponse.json(updatedInvitation?.[0] || updatedInvitation, { status: 200 })
    }

    // Create the invitation
    const { data: invitation, error } = await supabase
      .from('board_invitations')
      .insert([{
        board_id,
        inviter_id: user.id,
        invitee_id,
        status: 'pending'
      }])
      .select()

    if (error) throw error

    // Send email notification
    notifyBoardInvitation(board_id, invitee_id, user.id).catch(err =>
      console.error('Failed to send invitation notification:', err)
    )

    return NextResponse.json(invitation?.[0] || invitation, { status: 201 })
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    )
  }
}
