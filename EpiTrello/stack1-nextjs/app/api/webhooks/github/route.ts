import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { updateCardCompletion } from '@/lib/github-utils'

// Helper to create Supabase client with service role (only at runtime)
function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

function verifyGitHubSignature(payload: string, signature: string): boolean {
    const secret = process.env.GITHUB_WEBHOOK_SECRET
    if (!secret) return false

    const hmac = crypto.createHmac('sha256', secret)
    const digest = 'sha256=' + hmac.update(payload).digest('hex')

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
    )
}

interface GitHubWebhookPayload {
    action: string
    issue: { number: number; state: string }
    repository: { owner: { login: string }; name: string }
}

async function handleIssueEvent(payload: GitHubWebhookPayload) {
    const supabase = getSupabaseAdmin()
    const { action, issue, repository } = payload

    if (!['opened', 'closed', 'reopened'].includes(action)) {
        return { processed: false, reason: 'action_not_tracked' }
    }

    const repoOwner = repository.owner.login
    const repoName = repository.name
    const issueNumber = issue.number
    const newState = issue.state

    console.log(`📬 Webhook: ${action} issue #${issueNumber} in ${repoOwner}/${repoName} → ${newState}`)

    const { data: links, error } = await supabase
        .from('card_github_links')
        .select('id, card_id')
        .eq('github_repo_owner', repoOwner)
        .eq('github_repo_name', repoName)
        .eq('github_number', issueNumber)

    if (error) {
        console.error('Error fetching linked cards:', error)
        return { processed: false, error }
    }

    if (!links || links.length === 0) {
        return { processed: false, reason: 'no_linked_cards' }
    }

    const { error: updateError } = await supabase
        .from('card_github_links')
        .update({
            github_state: newState,
            synced_at: new Date().toISOString()
        })
        .eq('github_repo_owner', repoOwner)
        .eq('github_repo_name', repoName)
        .eq('github_number', issueNumber)

    if (updateError) {
        console.error('Error updating card links:', updateError)
        return { processed: false, error: updateError }
    }

    await new Promise(resolve => setTimeout(resolve, 100))

    for (const link of links) {
        await updateCardCompletion(supabase, link.card_id)
    }

    return {
        processed: true,
        cardsUpdated: links.length,
        action,
        newState
    }
}

export async function POST(request: NextRequest) {
    try {
        const signature = request.headers.get('x-hub-signature-256')
        const event = request.headers.get('x-github-event')

        const body = await request.text()

        if (!signature || !verifyGitHubSignature(body, signature)) {
            console.error('❌ Invalid webhook signature')
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 401 }
            )
        }

        const payload = JSON.parse(body)

        if (event === 'ping') {
            console.log('🏓 Webhook ping received')
            return NextResponse.json({
                message: 'pong',
                hookId: payload.hook_id,
                repository: payload.repository?.full_name
            })
        }

        if (event === 'issues') {
            const result = await handleIssueEvent(payload)
            return NextResponse.json({
                success: true,
                ...result
            })
        }

        return NextResponse.json({
            message: 'Event not handled',
            event
        })

    } catch (error) {
        console.error('Error processing webhook:', error)
        const message = error instanceof Error ? error.message : 'Internal server error'
        return NextResponse.json(
            { error: message },
            { status: 500 }
        )
    }
}
