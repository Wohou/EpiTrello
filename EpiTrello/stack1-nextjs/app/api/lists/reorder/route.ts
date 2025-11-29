import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function PUT(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { lists } = await request.json()

    // Update each list's position
    const updates = lists.map((list: { id: string; position: number }) =>
      supabase
        .from('lists')
        .update({ position: list.position })
        .eq('id', list.id)
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error reordering lists:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to reorder lists' },
      { status: 500 }
    )
  }
}
