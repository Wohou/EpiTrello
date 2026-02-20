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

// GET: Get all labels for a board
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

    const { data: labels, error } = await supabase
      .from('board_labels')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ labels: labels || [] })
  } catch (error) {
    console.error('Error fetching board labels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create a new label for a board
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

    const { data: label, error } = await supabase
      .from('board_labels')
      .insert({
        board_id: boardId,
        name: name.trim(),
        color: color || '#e3fcef',
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Label already exists' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ label })
  } catch (error) {
    console.error('Error creating board label:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete a label from a board
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

    const { labelId } = await request.json()

    if (!labelId) {
      return NextResponse.json({ error: 'Label ID is required' }, { status: 400 })
    }

    // Get the label name before deleting
    const { data: labelData } = await supabase
      .from('board_labels')
      .select('name')
      .eq('id', labelId)
      .single()

    const labelName = labelData?.name

    // Delete the board label
    const { error } = await supabase
      .from('board_labels')
      .delete()
      .eq('id', labelId)
      .eq('board_id', params.id)

    if (error) throw error

    // Cascade: remove this label from all cards in the board
    // Use admin client to bypass RLS and ensure all cards are updated
    if (labelName) {
      const supabaseAdmin = getSupabaseAdmin()
      const { data: lists } = await supabaseAdmin
        .from('lists')
        .select('id')
        .eq('board_id', params.id)

      if (lists && lists.length > 0) {
        const listIds = lists.map((l: { id: string }) => l.id)
        // Get ALL cards in this board's lists
        const { data: allCards } = await supabaseAdmin
          .from('cards')
          .select('id, labels')
          .in('list_id', listIds)

        // Filter in JS for cards that have this label (more reliable than .contains())
        const cardsWithLabel = (allCards || []).filter(
          (card: { id: string; labels: string[] | null }) =>
            Array.isArray(card.labels) && card.labels.includes(labelName)
        )

        if (cardsWithLabel.length > 0) {
          // Update each card to remove the deleted label
          await Promise.all(
            cardsWithLabel.map((card: { id: string; labels: string[] }) =>
              supabaseAdmin
                .from('cards')
                .update({ labels: card.labels.filter((l: string) => l !== labelName) })
                .eq('id', card.id)
            )
          )
        }
      }
    }

    return NextResponse.json({ success: true, deletedName: labelName })
  } catch (error) {
    console.error('Error deleting board label:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
