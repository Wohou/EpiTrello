import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { notifyCardMoved } from '@/lib/email-service'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { cards } = await request.json()

    // Get current list_id for each card to detect list changes
    const cardIds = cards.map((c: { id: string }) => c.id)
    const { data: currentCards } = await supabaseAdmin
      .from('cards')
      .select('id, list_id')
      .in('id', cardIds)

    const currentListMap = new Map<string, string>()
    currentCards?.forEach((c: { id: string; list_id: string }) => {
      currentListMap.set(c.id, c.list_id)
    })

    // Detect cards that moved to a different list
    const movedCards: { cardId: string; fromListId: string; toListId: string }[] = []
    for (const card of cards) {
      const oldListId = currentListMap.get(card.id)
      if (oldListId && oldListId !== card.list_id) {
        movedCards.push({
          cardId: card.id,
          fromListId: oldListId,
          toListId: card.list_id,
        })
      }
    }

    // Update each card's position and list_id
    const updates = cards.map((card: { id: string; position: number; list_id: string }) =>
      supabaseAdmin
        .from('cards')
        .update({ position: card.position, list_id: card.list_id })
        .eq('id', card.id)
    )

    await Promise.all(updates)

    // Send notifications for moved cards (async, don't await)
    for (const moved of movedCards) {
      notifyCardMoved(moved.cardId, moved.fromListId, moved.toListId, user.id).catch(err =>
        console.error('Failed to send card move notification:', err)
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Error reordering cards:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to reorder cards'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
