/* eslint-disable @typescript-eslint/no-explicit-any */
import { updateCardCompletion } from '../lib/github-utils'

describe('github-utils', () => {
  describe('updateCardCompletion', () => {
    let mockSupabase: any

    beforeEach(() => {
      jest.spyOn(console, 'error').mockImplementation(() => {})
      jest.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
      jest.restoreAllMocks()
    })

    it('should return true when all issues are closed', async () => {
      const selectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { github_state: 'closed' },
            { github_state: 'closed' },
          ],
          error: null,
        }),
      }

      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      mockSupabase = {
        from: jest.fn((table: string) => {
          if (table === 'card_github_links') return selectChain
          if (table === 'cards') return updateChain
          return selectChain
        }),
      }

      const result = await updateCardCompletion(mockSupabase, 'card-1')
      expect(result).toBe(true)
    })

    it('should return false when some issues are open', async () => {
      const selectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [
            { github_state: 'closed' },
            { github_state: 'open' },
          ],
          error: null,
        }),
      }

      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      mockSupabase = {
        from: jest.fn((table: string) => {
          if (table === 'card_github_links') return selectChain
          if (table === 'cards') return updateChain
          return selectChain
        }),
      }

      const result = await updateCardCompletion(mockSupabase, 'card-1')
      expect(result).toBe(false)
    })

    it('should return false when no links exist', async () => {
      const selectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }

      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      mockSupabase = {
        from: jest.fn((table: string) => {
          if (table === 'card_github_links') return selectChain
          if (table === 'cards') return updateChain
          return selectChain
        }),
      }

      const result = await updateCardCompletion(mockSupabase, 'card-1')
      expect(result).toBe(false)
    })

    it('should return false when data is null', async () => {
      const selectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }

      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      mockSupabase = {
        from: jest.fn((table: string) => {
          if (table === 'card_github_links') return selectChain
          if (table === 'cards') return updateChain
          return selectChain
        }),
      }

      const result = await updateCardCompletion(mockSupabase, 'card-1')
      expect(result).toBe(false)
    })

    it('should return false on fetch error', async () => {
      const selectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'DB error' },
        }),
      }

      mockSupabase = {
        from: jest.fn().mockReturnValue(selectChain),
      }

      const result = await updateCardCompletion(mockSupabase, 'card-1')
      expect(result).toBe(false)
    })

    it('should return false on update error', async () => {
      const selectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ github_state: 'closed' }],
          error: null,
        }),
      }

      const updateChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      }

      mockSupabase = {
        from: jest.fn((table: string) => {
          if (table === 'card_github_links') return selectChain
          if (table === 'cards') return updateChain
          return selectChain
        }),
      }

      const result = await updateCardCompletion(mockSupabase, 'card-1')
      expect(result).toBe(false)
    })

    it('should return false when exception is thrown', async () => {
      mockSupabase = {
        from: jest.fn().mockImplementation(() => {
          throw new Error('Connection error')
        }),
      }

      const result = await updateCardCompletion(mockSupabase, 'card-1')
      expect(result).toBe(false)
    })
  })
})
