import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', params.id)
      .single()

    if (boardError) throw boardError

    // Fetch lists with cards
    const { data: lists, error: listsError } = await supabase
      .from('lists')
      .select('*')
      .eq('board_id', params.id)
      .order('position', { ascending: true })

    if (listsError) throw listsError

    // Fetch cards for each list
    const listsWithCards = await Promise.all(
      (lists || []).map(async (list) => {
        const { data: cards, error: cardsError } = await supabase
          .from('cards')
          .select('*')
          .eq('list_id', list.id)
          .order('position', { ascending: true })

        if (cardsError) throw cardsError

        return {
          ...list,
          cards: cards || []
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
    const body = await request.json()
    const { title, description } = body

    const { data, error } = await supabase
      .from('boards')
      .update({ title, description, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

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
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting board:', error)
    return NextResponse.json(
      { error: 'Failed to delete board' },
      { status: 500 }
    )
  }
}
