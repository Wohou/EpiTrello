import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { cards } = await request.json()

    // Update each card's position and list_id
    const updates = cards.map((card: { id: string; position: number; list_id: string }) =>
      supabase
        .from('cards')
        .update({ position: card.position, list_id: card.list_id })
        .eq('id', card.id)
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error reordering cards:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reorder cards' },
      { status: 500 }
    )
  }
}
