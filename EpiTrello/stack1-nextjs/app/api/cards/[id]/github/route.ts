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

    const cardId = params.id

    const { data: links, error } = await supabase
      .from('card_github_links')
      .select('*')
      .eq('card_id', cardId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(links || [])
  } catch (error: any) {
    console.error('Error fetching GitHub links:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch GitHub links' },
      { status: 500 }
    )
  }
}

// Link a card to a GitHub issue/PR
export async function POST(
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

    const cardId = params.id
    const body = await request.json()
    const {
      github_type,
      github_repo_owner,
      github_repo_name,
      github_number,
      github_url,
      github_title,
      github_state,
    } = body

    if (!github_type || !github_repo_owner || !github_repo_name || !github_number || !github_url) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('card_github_links')
      .insert([{
        card_id: cardId,
        github_type,
        github_repo_owner,
        github_repo_name,
        github_number,
        github_url,
        github_title,
        github_state,
        created_by: user.id,
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This GitHub issue is already linked to this card' },
          { status: 400 }
        )
      }
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    console.error('Error creating GitHub link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create GitHub link' },
      { status: 500 }
    )
  }
}

// Delete a GitHub link
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

    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('linkId')

    if (!linkId) {
      return NextResponse.json(
        { error: 'linkId is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('card_github_links')
      .delete()
      .eq('id', linkId)
      .eq('created_by', user.id) // Only allow deleting own links TODO: other allowed users?

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting GitHub link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete GitHub link' },
      { status: 500 }
    )
  }
}
