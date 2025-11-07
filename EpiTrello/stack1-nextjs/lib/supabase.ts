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
}

export interface BoardMember {
  board_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'observer'
  joined_at: string
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
  created_at: string
  updated_at: string
}

// Extended types with relations
export interface BoardWithLists extends Board {
  lists: ListWithCards[]
}

export interface ListWithCards extends List {
  cards: Card[]
}
