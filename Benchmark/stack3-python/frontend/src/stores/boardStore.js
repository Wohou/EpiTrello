import { defineStore } from 'pinia'
import api from '../services/api'

export const useBoardStore = defineStore('board', {
  state: () => ({
    boards: [],
    currentBoard: null,
    loading: false,
    error: null
  }),

  actions: {
    async fetchBoards() {
      this.loading = true
      this.error = null
      try {
        const response = await api.getBoards()
        console.log('Boards API response:', response.data)
        // Handle paginated response (response.data.results) or direct array
        const boardsData = response.data.results || response.data || []
        // Filter out any null/undefined boards
        this.boards = Array.isArray(boardsData)
          ? boardsData.filter(board => board && board.id)
          : []
        console.log('Filtered boards:', this.boards)
      } catch (error) {
        this.error = error.message
        console.error('Error fetching boards:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchBoard(id) {
      this.loading = true
      this.error = null
      try {
        const response = await api.getBoard(id)
        this.currentBoard = response.data
      } catch (error) {
        this.error = error.message
        console.error('Error fetching board:', error)
      } finally {
        this.loading = false
      }
    },

    async createBoard(board) {
      try {
        const response = await api.createBoard(board)
        this.boards.push(response.data)
        return response.data
      } catch (error) {
        this.error = error.message
        console.error('Error creating board:', error)
        throw error
      }
    },

    async deleteBoard(id) {
      try {
        await api.deleteBoard(id)
        this.boards = this.boards.filter(b => b.id !== id)
      } catch (error) {
        this.error = error.message
        console.error('Error deleting board:', error)
        throw error
      }
    },

    async createList(list) {
      try {
        const response = await api.createList(list)
        if (this.currentBoard) {
          this.currentBoard.lists.push(response.data)
        }
        return response.data
      } catch (error) {
        this.error = error.message
        console.error('Error creating list:', error)
        throw error
      }
    },

    async deleteList(id) {
      try {
        await api.deleteList(id)
        if (this.currentBoard) {
          this.currentBoard.lists = this.currentBoard.lists.filter(l => l.id !== id)
        }
      } catch (error) {
        this.error = error.message
        console.error('Error deleting list:', error)
        throw error
      }
    },

    async createCard(card) {
      try {
        const response = await api.createCard(card)
        if (this.currentBoard) {
          const list = this.currentBoard.lists.find(l => l.id === card.list)
          if (list) {
            list.cards.push(response.data)
          }
        }
        return response.data
      } catch (error) {
        this.error = error.message
        console.error('Error creating card:', error)
        throw error
      }
    },

    async deleteCard(listId, cardId) {
      try {
        await api.deleteCard(cardId)
        if (this.currentBoard) {
          const list = this.currentBoard.lists.find(l => l.id === listId)
          if (list) {
            list.cards = list.cards.filter(c => c.id !== cardId)
          }
        }
      } catch (error) {
        this.error = error.message
        console.error('Error deleting card:', error)
        throw error
      }
    }
  }
})
