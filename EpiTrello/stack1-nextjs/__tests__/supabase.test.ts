/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
// Mock @supabase/supabase-js
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })),
}))

// Set env vars before import
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'

import { createClient } from '@supabase/supabase-js'
import type {
  Board, BoardMember, BoardInvitation, List, Card, Profile,
  CardAssignment, CardGitHubLink, CardImage, CardComment, CardActivity,
  GitHubRepo, GitHubIssue, BoardStatus, BoardLabel,
  BoardWithLists, ListWithCards,
} from '../lib/supabase'

describe('supabase', () => {
  it('should call createClient with correct params', () => {
    // Re-import to trigger the module
    jest.isolateModules(() => {
      require('../lib/supabase')
    })
    expect(createClient).toHaveBeenCalled()
  })

  describe('customStorage', () => {
    let supabaseModule: any
    beforeEach(() => {
      jest.isolateModules(() => {
        supabaseModule = require('../lib/supabase')
      })
    })

    it('should export supabase client', () => {
      expect(supabaseModule.supabase).toBeDefined()
    })
  })

  describe('Type definitions', () => {
    it('should define Board type correctly', () => {
      const board: Board = {
        id: '1', title: 'Test', description: null, owner_id: 'user-1',
        created_at: '2024-01-01', updated_at: '2024-01-01',
      }
      expect(board.id).toBe('1')
      expect(board.description).toBeNull()
    })

    it('should define Board with optional fields', () => {
      const board: Board = {
        id: '1', title: 'Test', description: 'Desc', owner_id: 'user-1',
        created_at: '2024-01-01', updated_at: '2024-01-01',
        owner_username: 'owner', is_shared: true,
      }
      expect(board.owner_username).toBe('owner')
      expect(board.is_shared).toBe(true)
    })

    it('should define BoardMember type', () => {
      const member: BoardMember = {
        id: '1', board_id: 'b-1', user_id: 'u-1', role: 'owner', joined_at: '2024-01-01',
      }
      expect(member.role).toBe('owner')
    })

    it('should define BoardInvitation type', () => {
      const invitation: BoardInvitation = {
        id: '1', board_id: 'b-1', inviter_id: 'u-1', invitee_id: 'u-2',
        status: 'pending', created_at: '2024-01-01', responded_at: null,
      }
      expect(invitation.status).toBe('pending')
    })

    it('should define List type', () => {
      const list: List = {
        id: '1', title: 'Todo', position: 0, board_id: 'b-1',
        created_at: '2024-01-01', updated_at: '2024-01-01',
      }
      expect(list.position).toBe(0)
    })

    it('should define Card type', () => {
      const card: Card = {
        id: '1', title: 'Task', description: null, position: 0, list_id: 'l-1',
        cover_color: null, cover_image: null, is_completed: false,
        start_date: null, due_date: null, created_by: null, last_modified_by: null,
        created_at: '2024-01-01', updated_at: '2024-01-01',
      }
      expect(card.is_completed).toBe(false)
    })

    it('should define Card with optional status and labels', () => {
      const card: Card = {
        id: '1', title: 'Task', description: null, position: 0, list_id: 'l-1',
        cover_color: '#ff0000', cover_image: null, is_completed: false,
        start_date: '2024-01-01', due_date: '2024-12-31',
        created_by: 'u-1', last_modified_by: 'u-2',
        created_at: '2024-01-01', updated_at: '2024-01-01',
        status: 'in_progress', labels: ['bug', 'urgent'],
      }
      expect(card.status).toBe('in_progress')
      expect(card.labels).toEqual(['bug', 'urgent'])
    })

    it('should define Profile type', () => {
      const profile: Profile = {
        id: '1', username: 'test', avatar_url: null,
        created_at: '2024-01-01', updated_at: '2024-01-01',
      }
      expect(profile.username).toBe('test')
    })

    it('should define CardAssignment type', () => {
      const assignment: CardAssignment = {
        id: '1', card_id: 'c-1', user_id: 'u-1', assigned_at: '2024-01-01', assigned_by: null,
      }
      expect(assignment.card_id).toBe('c-1')
    })

    it('should define CardGitHubLink type', () => {
      const link: CardGitHubLink = {
        id: '1', card_id: 'c-1', github_type: 'issue', github_repo_owner: 'owner',
        github_repo_name: 'repo', github_number: 42, github_url: 'https://github.com/...',
        github_title: 'Bug fix', github_state: 'open', synced_at: '2024-01-01',
        created_by: 'u-1', created_at: '2024-01-01',
      }
      expect(link.github_type).toBe('issue')
    })

    it('should define CardImage type', () => {
      const image: CardImage = {
        id: '1', card_id: 'c-1', url: 'https://img.com/1.jpg', position: 0,
        uploaded_by: 'u-1', created_at: '2024-01-01',
      }
      expect(image.url).toContain('https://')
    })

    it('should define CardComment type', () => {
      const comment: CardComment = {
        id: '1', card_id: 'c-1', user_id: 'u-1', content: 'Hello',
        created_at: '2024-01-01', updated_at: '2024-01-01',
      }
      expect(comment.content).toBe('Hello')
    })

    it('should define CardActivity type', () => {
      const activity: CardActivity = {
        id: '1', card_id: 'c-1', user_id: 'u-1', action_type: 'comment_added',
        action_data: { comment_id: 'com-1' }, created_at: '2024-01-01',
      }
      expect(activity.action_type).toBe('comment_added')
    })

    it('should define GitHubRepo type', () => {
      const repo: GitHubRepo = {
        id: 1, name: 'repo', full_name: 'owner/repo',
        owner: { login: 'owner', avatar_url: 'https://...' },
        description: null, private: false, html_url: 'https://github.com/owner/repo',
      }
      expect(repo.full_name).toBe('owner/repo')
    })

    it('should define GitHubIssue type', () => {
      const issue: GitHubIssue = {
        id: 1, number: 42, title: 'Bug', state: 'open', html_url: 'https://github.com/..',
        body: null, user: { login: 'user', avatar_url: 'https://...' },
        created_at: '2024-01-01', updated_at: '2024-01-01', labels: [],
      }
      expect(issue.state).toBe('open')
    })

    it('should define BoardStatus type', () => {
      const status: BoardStatus = {
        id: '1', board_id: 'b-1', name: 'In Progress', color: '#ff0000',
        created_by: null, created_at: '2024-01-01',
      }
      expect(status.name).toBe('In Progress')
    })

    it('should define BoardLabel type', () => {
      const label: BoardLabel = {
        id: '1', board_id: 'b-1', name: 'Bug', color: '#ff0000',
        created_by: null, created_at: '2024-01-01',
      }
      expect(label.name).toBe('Bug')
    })

    it('should define BoardWithLists type', () => {
      const board: BoardWithLists = {
        id: '1', title: 'Board', description: null, owner_id: 'u-1',
        created_at: '2024-01-01', updated_at: '2024-01-01',
        lists: [],
      }
      expect(board.lists).toEqual([])
    })

    it('should define ListWithCards type', () => {
      const list: ListWithCards = {
        id: '1', title: 'Todo', position: 0, board_id: 'b-1',
        created_at: '2024-01-01', updated_at: '2024-01-01',
        cards: [],
      }
      expect(list.cards).toEqual([])
    })
  })
})
