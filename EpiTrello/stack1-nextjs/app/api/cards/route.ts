import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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

    const listId = request.nextUrl.searchParams.get('listId')

    if (!listId) {
      return NextResponse.json(
        { error: 'listId is required' },
        { status: 400 }
      )
    }

    // RLS will automatically filter cards based on board access
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('list_id', listId)
      .order('position', { ascending: true })

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching cards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cards' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { title, list_id, description, status = null, labels = [], position = 0 } = body

    if (!title || !list_id) {
      return NextResponse.json(
        { error: 'title and list_id are required' },
        { status: 400 }
      )
    }

    // RLS will check if user has access to the board
    const { data, error } = await supabase
      .from('cards')
      .insert([{
        title,
        description,
        status,
        labels,
        list_id,
        position,
        created_by: user.id,
        last_modified_by: user.id
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating card:', error)
    return NextResponse.json(
      { error: 'Failed to create card' },
      { status: 500 }
    )
  }
}
