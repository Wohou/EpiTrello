import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const listId = request.nextUrl.searchParams.get('listId')

    if (!listId) {
      return NextResponse.json(
        { error: 'listId is required' },
        { status: 400 }
      )
    }

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
    const body = await request.json()
    const { title, list_id, description, position = 0 } = body

    if (!title || !list_id) {
      return NextResponse.json(
        { error: 'title and list_id are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('cards')
      .insert([{ title, description, list_id, position }])
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
