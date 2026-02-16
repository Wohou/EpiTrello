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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const cardId = formData.get('cardId') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${cardId}-${Date.now()}.${fileExt}`
    const filePath = `card-covers/${fileName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('cards')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('cards')
      .getPublicUrl(filePath)

    // Insert into card_images table (multi-image support)
    const supabaseAdmin = getSupabaseAdmin()

    // Get current max position for this card
    const { data: existingImages } = await supabaseAdmin
      .from('card_images')
      .select('position')
      .eq('card_id', cardId)
      .order('position', { ascending: false })
      .limit(1)

    const nextPosition = existingImages && existingImages.length > 0 ? existingImages[0].position + 1 : 0

    const { error: insertError } = await supabaseAdmin
      .from('card_images')
      .insert({
        card_id: cardId,
        url: publicUrl,
        position: nextPosition,
        uploaded_by: user.id,
      })

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save image record' },
        { status: 500 }
      )
    }

    // Also set cover_image to the first image if card has no cover_image yet
    const { data: card } = await supabaseAdmin
      .from('cards')
      .select('cover_image')
      .eq('id', cardId)
      .single()

    if (card && !card.cover_image) {
      await supabaseAdmin
        .from('cards')
        .update({
          cover_image: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId)
    }

    // Return all images for this card
    const { data: allImages } = await supabaseAdmin
      .from('card_images')
      .select('*')
      .eq('card_id', cardId)
      .order('position', { ascending: true })

    return NextResponse.json({ url: publicUrl, images: allImages || [] })
  } catch (error: unknown) {
    console.error('Error uploading card image:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload image'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
