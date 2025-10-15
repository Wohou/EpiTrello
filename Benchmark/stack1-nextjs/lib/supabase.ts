import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export interface Board {
  id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
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
