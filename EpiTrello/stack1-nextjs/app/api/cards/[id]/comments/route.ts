import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { notifyCommentAdded } from '@/lib/email-service'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET: List all comments for a card
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

    const { data: comments, error } = await supabaseAdmin
      .from('card_comments')
      .select('*')
      .eq('card_id', params.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Enrich with user profiles
    const enriched = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', comment.user_id)
          .single()
        return {
          ...comment,
          username: profile?.username || 'Unknown',
          avatar_url: profile?.avatar_url || null,
        }
      })
    )

    return NextResponse.json({ comments: enriched })
  } catch (error) {
    console.error('Error fetching card comments:', error)
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
  }
}

// POST: Add a comment to a card
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

    const { content, parent_comment_id } = await request.json()

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Insert the comment
    const { data: comment, error } = await supabaseAdmin
      .from('card_comments')
      .insert({
        card_id: params.id,
        user_id: user.id,
        content: content.trim(),
        parent_comment_id: parent_comment_id || null,
      })
      .select()
      .single()

    if (error) throw error

    // Log activity
    await supabaseAdmin
      .from('card_activity')
      .insert({
        card_id: params.id,
        user_id: user.id,
        action_type: 'comment_added',
        action_data: { comment_id: comment.id },
      })

    // Send email notification (async, don't await to not block response)
    notifyCommentAdded(params.id, content.trim(), user.id).catch(err =>
      console.error('Failed to send comment notification:', err)
    )

    // Get profile for the response
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      comment: {
        ...comment,
        username: profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url || null,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}

// PUT: Edit a comment
export async function PUT(
  request: NextRequest,
  //   _context: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { commentId, content } = await request.json()

    if (!commentId || !content?.trim()) {
      return NextResponse.json({ error: 'commentId and content are required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Verify user owns the comment
    const { data: existing } = await supabaseAdmin
      .from('card_comments')
      .select('user_id')
      .eq('id', commentId)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Cannot edit this comment' }, { status: 403 })
    }

    const { data: comment, error } = await supabaseAdmin
      .from('card_comments')
      .update({ content: content.trim(), updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select()
      .single()

    if (error) throw error

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('username, avatar_url')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      comment: {
        ...comment,
        username: profile?.username || 'Unknown',
        avatar_url: profile?.avatar_url || null,
      },
    })
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
  }
}

// DELETE: Remove a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { commentId } = await request.json()

    if (!commentId) {
      return NextResponse.json({ error: 'commentId is required' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Verify user owns the comment
    const { data: existing } = await supabaseAdmin
      .from('card_comments')
      .select('user_id')
      .eq('id', commentId)
      .single()

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Cannot delete this comment' }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from('card_comments')
      .delete()
      .eq('id', commentId)

    if (error) throw error

    // Log activity
    await supabaseAdmin
      .from('card_activity')
      .insert({
        card_id: params.id,
        user_id: user.id,
        action_type: 'comment_deleted',
      })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}
