import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Update card completion status based on all linked GitHub issues
 * If ALL issues are closed → card is completed
 * If ANY issue is open → card is not completed
 */
export async function updateCardCompletion(
    supabase: SupabaseClient,
    cardId: string
): Promise<boolean> {
    try {
        const { data: allLinks, error: fetchError } = await supabase
            .from('card_github_links')
            .select('github_state')
            .eq('card_id', cardId)

        if (fetchError) {
            console.error('Error fetching card links:', fetchError)
            return false
        }

        if (!allLinks || allLinks.length === 0) {
            await supabase
                .from('cards')
                .update({ is_completed: false })
                .eq('id', cardId)
            return false
        }

        const allClosed = allLinks.every((l: { github_state: string }) => l.github_state === 'closed')

        const { error: updateError } = await supabase
            .from('cards')
            .update({ is_completed: allClosed })
            .eq('id', cardId)

        if (updateError) {
            console.error('Error updating card completion:', updateError)
            return false
        }

        console.log(`✓ Updated card ${cardId}: is_completed=${allClosed} (${allLinks.length} issues)`)
        return allClosed
    } catch (error) {
        console.error('Error updating card completion:', error)
        return false
    }
}
