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

// GET: List all images for a card
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

    const supabaseAdmin = getSupabaseAdmin()

    const { data: images, error } = await supabaseAdmin
      .from('card_images')
      .select('*')
      .eq('card_id', params.id)
      .order('position', { ascending: true })

    if (error) throw error

    return NextResponse.json({ images: images || [] })
  } catch (error) {
    console.error('Error fetching card images:', error)
    return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
  }
}

// DELETE: Remove a specific image by image ID (passed in body)
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

    const { imageId, all } = await request.json()

    const supabaseAdmin = getSupabaseAdmin()

    if (all) {
      // Delete ALL images for this card
      const { error } = await supabaseAdmin
        .from('card_images')
        .delete()
        .eq('card_id', params.id)

      if (error) throw error

      // Also clear cover_image on the card
      await supabaseAdmin
        .from('cards')
        .update({ cover_image: null })
        .eq('id', params.id)

      return NextResponse.json({ images: [] })
    }

    if (!imageId) {
      return NextResponse.json({ error: 'imageId or all is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('card_images')
      .delete()
      .eq('id', imageId)
      .eq('card_id', params.id)

    if (error) throw error

    // Fetch remaining images
    const { data: images } = await supabaseAdmin
      .from('card_images')
      .select('*')
      .eq('card_id', params.id)
      .order('position', { ascending: true })

    return NextResponse.json({ images: images || [] })
  } catch (error) {
    console.error('Error deleting card image:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
