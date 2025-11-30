import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Custom storage adapter that ensures localStorage is available
const customStorage = {
  getItem: (key: string) => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(key)
    }
    return null
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, value)
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key)
    }
  },
}

// Create Supabase client with proper session management
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: customStorage,
  }
})

// Types for our database tables
export interface Board {
  id: string
  title: string
  description: string | null
  owner_id: string
  created_at: string
  updated_at: string
  // Extended fields for shared boards
  owner_username?: string
  is_shared?: boolean
}

export interface BoardMember {
  id: string
  board_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'observer'
  joined_at: string
  // Extended fields
  username?: string
  avatar_url?: string
}

export interface BoardInvitation {
  id: string
  board_id: string
  inviter_id: string
  invitee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  responded_at: string | null
  // Extended fields
  board_title?: string
  inviter_username?: string
}

export interface List {
  id: string
  title: string
  position: number
  board_id: string
  created_at: string
  updated_at: string
}

export interface Card {
  id: string
  title: string
  description: string | null
  position: number
  list_id: string
  cover_color: string | null
  cover_image: string | null
  is_completed: boolean
  start_date: string | null
  due_date: string | null
  created_by: string | null
  last_modified_by: string | null
  created_at: string
  updated_at: string
  // Extended fields for display
  created_by_username?: string
  last_modified_by_username?: string
}

// Extended types with relations
export interface BoardWithLists extends Board {
  lists: ListWithCards[]
}

export interface ListWithCards extends List {
  cards: Card[]
}
