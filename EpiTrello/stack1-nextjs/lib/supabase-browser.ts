'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Create a singleton instance for client components
let clientInstance: ReturnType<typeof createClientComponentClient> | null = null

export function getSupabaseBrowserClient() {
  if (!clientInstance) {
    clientInstance = createClientComponentClient()
  }
  return clientInstance
}

// Export for convenience
export const supabaseBrowser = getSupabaseBrowserClient()
