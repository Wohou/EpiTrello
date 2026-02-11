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

// PUT: Accept or decline an invitation
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

    const body = await request.json()
    const { action } = body // 'accept' or 'decline'

    if (!action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Use "accept" or "decline"' },
        { status: 400 }
      )
    }

    // Get the invitation
    const { data: invitation, error: invError } = await supabase
      .from('board_invitations')
      .select('*')
      .eq('id', params.id)
      .single()

    if (invError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if user is the invitee
    if (invitation.invitee_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only respond to your own invitations' },
        { status: 403 }
      )
    }

    // Check if invitation is still pending
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'This invitation has already been responded to' },
        { status: 400 }
      )
    }

    // Update invitation status
    const newStatus = action === 'accept' ? 'accepted' : 'declined'
    const { error: updateError } = await supabase
      .from('board_invitations')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (updateError) throw updateError

    // If accepted, add user to board_members using admin client to bypass RLS
    if (action === 'accept') {
      const supabaseAdmin = getSupabaseAdmin()
      const { error: memberError } = await supabaseAdmin
        .from('board_members')
        .upsert({
          board_id: invitation.board_id,
          user_id: user.id,
          role: 'member'
        }, {
          onConflict: 'board_id,user_id',
          ignoreDuplicates: true
        })

      if (memberError) {
        console.error('Error adding member:', memberError)
        // Don't throw, the invitation was already accepted
      }
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (error) {
    console.error('Error responding to invitation:', error)
    return NextResponse.json(
      { error: 'Failed to respond to invitation' },
      { status: 500 }
    )
  }
}

// DELETE: Cancel an invitation (by board owner)
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

    // Get the invitation with board info
    const { data: invitation, error: invError } = await supabase
      .from('board_invitations')
      .select(`
        *,
        boards:board_id (owner_id)
      `)
      .eq('id', params.id)
      .single()

    if (invError || !invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    // Check if user is the board owner or the invitee
    const isOwner = invitation.boards?.owner_id === user.id
    const isInvitee = invitation.invitee_id === user.id

    if (!isOwner && !isInvitee) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this invitation' },
        { status: 403 }
      )
    }

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from('board_invitations')
      .delete()
      .eq('id', params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting invitation:', error)
    return NextResponse.json(
      { error: 'Failed to delete invitation' },
      { status: 500 }
    )
  }
}
