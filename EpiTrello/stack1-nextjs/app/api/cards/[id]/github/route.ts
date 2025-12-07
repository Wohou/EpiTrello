import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Function to create webhook if it doesn't exist
async function ensureWebhookExists(
  repoOwner: string,
  repoName: string,
  token: string,
  userId: string,
  supabase: any
) {
  try {
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET

    console.log('  📋 Webhook config:', {
      url: webhookUrl,
      secretSet: !!webhookSecret,
      appUrlSet: !!process.env.NEXT_PUBLIC_APP_URL
    })

    if (!webhookSecret || !process.env.NEXT_PUBLIC_APP_URL) {
      console.warn('⚠️ Webhook configuration missing, skipping webhook creation')
      return { created: false, reason: 'config_missing' }
    }

    const listResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/hooks`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      }
    )

    if (listResponse.ok) {
      const hooks = await listResponse.json()
      const existingHook = hooks.find((hook: any) =>
        hook.config?.url === webhookUrl
      )

      if (existingHook) {
        await supabase
          .from('github_webhooks')
          .upsert({
            user_id: userId,
            repo_owner: repoOwner,
            repo_name: repoName,
            webhook_id: existingHook.id.toString(),
            is_active: true,
          }, {
            onConflict: 'user_id,repo_owner,repo_name'
          })

        return { created: false, reason: 'already_exists', hookId: existingHook.id }
      }
    }

    // Create new webhook
    const createResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/hooks`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'web',
          active: true,
          events: ['issues'],
          config: {
            url: webhookUrl,
            content_type: 'json',
            secret: webhookSecret,
            insecure_ssl: '0'
          }
        })
      }
    )

    if (createResponse.status === 403) {
      return { created: false, reason: 'no_admin_permission' }
    }

    if (createResponse.status === 422) {
      const errorData = await createResponse.json()
      if (errorData.errors?.some((e: any) => e.message?.includes('already exists'))) {
        return { created: false, reason: 'already_exists' }
      }
      return { created: false, reason: 'validation_error', details: errorData }
    }

    if (!createResponse.ok) {
      console.error('Failed to create webhook:', await createResponse.text())
      return { created: false, reason: 'api_error' }
    }

    const webhookData = await createResponse.json()

    await supabase
      .from('github_webhooks')
      .upsert({
        user_id: userId,
        repo_owner: repoOwner,
        repo_name: repoName,
        webhook_id: webhookData.id.toString(),
        is_active: true,
        last_ping_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,repo_owner,repo_name'
      })

    return { created: true, hookId: webhookData.id }

  } catch (error) {
    console.error('Error ensuring webhook exists:', error)
    return { created: false, reason: 'error', error }
  }
}

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

    // Automatically create webhook for this repository
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.provider_token

    console.log('🔍 Attempting automatic webhook creation...')
    console.log('  - Repo:', `${github_repo_owner}/${github_repo_name}`)
    console.log('  - Token available:', !!token)

    let webhookResult = null
    if (token) {
      webhookResult = await ensureWebhookExists(
        github_repo_owner,
        github_repo_name,
        token,
        user.id,
        supabase
      )

      console.log('  - Webhook result:', webhookResult)

      if (webhookResult.created) {
        console.log(`✅ Webhook created automatically for ${github_repo_owner}/${github_repo_name}`)
      } else if (webhookResult.reason === 'already_exists') {
        console.log(`ℹ️ Webhook already exists for ${github_repo_owner}/${github_repo_name}`)
      } else if (webhookResult.reason === 'no_admin_permission') {
        console.log(`⚠️ No admin permission to create webhook for ${github_repo_owner}/${github_repo_name}`)
      } else {
        console.log(`❌ Failed to create webhook: ${webhookResult.reason}`, webhookResult)
      }
    } else {
      console.log('❌ No GitHub token found in session')
    }

    return NextResponse.json({
      ...data,
      webhook: webhookResult
    }, { status: 201 })
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

// Update a GitHub link state
export async function PATCH(
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
    const { linkId, github_state } = body

    if (!linkId || !github_state) {
      return NextResponse.json(
        { error: 'linkId and github_state are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('card_github_links')
      .update({
        github_state,
        synced_at: new Date().toISOString()
      })
      .eq('id', linkId)
      .select()
      .single()

    if (error) throw error

    const { data: allCardLinks } = await supabase
      .from('card_github_links')
      .select('github_state')
      .eq('card_id', cardId)

    if (allCardLinks && allCardLinks.length > 0) {
      const allIssuesClosed = allCardLinks.every((l: any) => l.github_state === 'closed')

      await supabase
        .from('cards')
        .update({
          is_completed: allIssuesClosed,
          updated_at: new Date().toISOString()
        })
        .eq('id', cardId)

      console.log(`Card ${cardId} updated: ${allIssuesClosed ? 'completed' : 'incomplete'} (${allCardLinks.length} issues)`)
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error updating GitHub link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update GitHub link' },
      { status: 500 }
    )
  }
}
