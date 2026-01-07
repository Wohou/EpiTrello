import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Update GitHub issue state when card completion status changes
export async function POST(request: NextRequest) {
    try {
        const supabase = createRouteHandlerClient({ cookies })

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { cardId, isCompleted } = body

        if (!cardId || typeof isCompleted !== 'boolean') {
            return NextResponse.json(
                { error: 'cardId and isCompleted are required' },
                { status: 400 }
            )
        }

        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.provider_token) {
            return NextResponse.json(
                { error: 'GitHub not connected' },
                { status: 403 }
            )
        }

        const token = session.provider_token

        const { data: links, error: fetchError } = await supabase
            .from('card_github_links')
            .select('*')
            .eq('card_id', cardId)

        if (fetchError) throw fetchError

        if (!links || links.length === 0) {
            return NextResponse.json({
                success: true,
                updated: 0,
                message: 'No GitHub links found'
            })
        }

        let updatedCount = 0
        const errors: string[] = []

        for (const link of links) {
            try {
                const newState = isCompleted ? 'closed' : 'open'

                if (link.github_state === newState) {
                    console.log(`Issue #${link.github_number} already ${newState}, skipping`)
                    continue
                }

                const response = await fetch(
                    `https://api.github.com/repos/${link.github_repo_owner}/${link.github_repo_name}/issues/${link.github_number}`,
                    {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github.v3+json',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ state: newState })
                    }
                )

                if (response.ok) {
                    const updatedIssue = await response.json()

                    await supabase
                        .from('card_github_links')
                        .update({
                            github_state: updatedIssue.state,
                        })
                        .eq('id', link.id)

                    updatedCount++
                    console.log(`Updated issue #${link.github_number} to ${newState}`)
                } else {
                    const errorData = await response.json()
                    errors.push(`Issue #${link.github_number}: ${errorData.message || 'Update failed'}`)
                    console.error(`Failed to update issue #${link.github_number}:`, errorData)
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error'
                errors.push(`Issue #${link.github_number}: ${message}`)
                console.error(`Error updating issue #${link.github_number}:`, error)
            }
        }

        return NextResponse.json({
            success: true,
            updated: updatedCount,
            total: links.length,
            errors: errors.length > 0 ? errors : undefined
        })
    } catch (error) {
        console.error('Error syncing card to GitHub:', error)
        const message = error instanceof Error ? error.message : 'Failed to sync to GitHub'
        return NextResponse.json(
            { error: message },
            { status: 500 }
        )
    }
}
