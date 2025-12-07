import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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

    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', params.id)
      .single()

    if (boardError) {
      if (boardError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Board not found or access denied' },
          { status: 404 }
        )
      }
      throw boardError
    }

    const { data: lists, error: listsError } = await supabase
      .from('lists')
      .select('*')
      .eq('board_id', params.id)
      .order('position', { ascending: true })

    if (listsError) throw listsError

    const listsWithCards = await Promise.all(
      (lists || []).map(async (list) => {
        const { data: cards, error: cardsError } = await supabase
          .from('cards')
          .select('*')
          .eq('list_id', list.id)
          .order('position', { ascending: true })

        if (cardsError) throw cardsError

        const cardsWithGitHub = await Promise.all(
          (cards || []).map(async (card) => {
            const { count } = await supabase
              .from('card_github_links')
              .select('*', { count: 'exact', head: true })
              .eq('card_id', card.id)

            return {
              ...card,
              github_links_count: count || 0
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

    const body = await request.json()
    const { title, description } = body

    const { data, error } = await supabase
      .from('boards')
      .update({ title, description, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Board not found or access denied' },
          { status: 404 }
        )
      }
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
