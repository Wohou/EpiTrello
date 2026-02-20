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

// GET: Get all statuses for a board
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

    const boardId = params.id

    const { data: statuses, error } = await supabase
      .from('board_statuses')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ statuses: statuses || [] })
  } catch (error) {
    console.error('Error fetching board statuses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create a new status for a board
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

    const boardId = params.id
    const { name, color } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data: status, error } = await supabase
      .from('board_statuses')
      .insert({
        board_id: boardId,
        name: name.trim(),
        color: color || '#deebff',
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Status already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ status })
  } catch (error) {
    console.error('Error creating board status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete a status from a board
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

    const { statusId } = await request.json()

    if (!statusId) {
      return NextResponse.json({ error: 'Status ID is required' }, { status: 400 })
    }

    // Get the status name before deleting
    const { data: statusData } = await supabase
      .from('board_statuses')
      .select('name')
      .eq('id', statusId)
      .single()

    const statusName = statusData?.name

    // Delete the board status
    const { error } = await supabase
      .from('board_statuses')
      .delete()
      .eq('id', statusId)
      .eq('board_id', params.id)

    if (error) throw error

    // Cascade: clear this status from all cards in the board
    // Use admin client to bypass RLS and ensure all cards are updated
    if (statusName) {
      const supabaseAdmin = getSupabaseAdmin()
      const { data: lists } = await supabaseAdmin
        .from('lists')
        .select('id')
        .eq('board_id', params.id)

      if (lists && lists.length > 0) {
        const listIds = lists.map((l: { id: string }) => l.id)
        await supabaseAdmin
          .from('cards')
          .update({ status: null })
          .in('list_id', listIds)
          .eq('status', statusName)
      }
    }

    return NextResponse.json({ success: true, deletedName: statusName })
  } catch (error) {
    console.error('Error deleting board status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
