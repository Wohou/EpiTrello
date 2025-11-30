import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
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

    // Fetch boards owned by user
    const { data: ownedBoards, error: ownedError } = await supabase
      .from('boards')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    if (ownedError) throw ownedError

    // Fetch boards shared with user (where user is a member but not owner)
    const { data: memberRecords, error: memberError } = await supabase
      .from('board_members')
      .select('board_id, role')
      .eq('user_id', user.id)

    let sharedBoards: any[] = []
    if (!memberError && memberRecords && memberRecords.length > 0) {
      // Filter out owner role and get board IDs
      const sharedMemberships = memberRecords.filter(m => m.role !== 'owner')
      const boardIds = sharedMemberships.map(m => m.board_id)

      if (boardIds.length > 0) {
        // Fetch shared boards first
        const { data: shared, error: sharedError } = await supabase
          .from('boards')
          .select('*')
          .in('id', boardIds)
          .order('created_at', { ascending: false })

        if (!sharedError && shared) {
          // Fetch owner usernames separately
          const ownerIds = [...new Set(shared.map(b => b.owner_id))]
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username')
            .in('id', ownerIds)

          const profileMap = new Map(profiles?.map(p => [p.id, p.username]) || [])

          sharedBoards = shared.map(board => ({
            ...board,
            is_shared: true,
            owner_username: profileMap.get(board.owner_id) || 'Utilisateur'
          }))
        }
      }
    }

    // Combine owned and shared boards
    const allBoards = [
      ...ownedBoards.map(b => ({ ...b, is_shared: false })),
      ...sharedBoards
    ]

    // Sort by created_at descending
    allBoards.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json(allBoards)
  } catch (error) {
    console.error('Error fetching boards:', error)
    return NextResponse.json(
      { error: 'Failed to fetch boards' },
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
    const { title, description } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create board with current user as owner
    const { data, error } = await supabase
      .from('boards')
      .insert([{
        title,
        description,
        owner_id: user.id
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating board:', error)
    return NextResponse.json(
      { error: 'Failed to create board' },
      { status: 500 }
    )
  }
}
