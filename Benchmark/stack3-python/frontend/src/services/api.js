import axios from 'axios'

// Use relative URL for API calls so Vite proxy can handle routing
const API_URL = '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export default {
  // Board operations
  getBoards() {
    return api.get('/boards/')
  },

  getBoard(id) {
    return api.get(`/boards/${id}/`)
  },

  createBoard(board) {
    return api.post('/boards/', board)
  },

  updateBoard(id, board) {
    return api.put(`/boards/${id}/`, board)
  },

  deleteBoard(id) {
    return api.delete(`/boards/${id}/`)
  },

  // List operations
  getLists(boardId) {
    return api.get('/lists/', { params: { board: boardId } })
  },

  createList(list) {
    return api.post('/lists/', list)
  },

  updateList(id, list) {
    return api.put(`/lists/${id}/`, list)
  },

  deleteList(id) {
    return api.delete(`/lists/${id}/`)
  },

  updateListPosition(id, position) {
    return api.patch(`/lists/${id}/update_position/`, { position })
  },

  // Card operations
  getCards(listId) {
    return api.get('/cards/', { params: { list: listId } })
  },

  createCard(card) {
    return api.post('/cards/', card)
  },

  updateCard(id, card) {
    return api.put(`/cards/${id}/`, card)
  },

  deleteCard(id) {
    return api.delete(`/cards/${id}/`)
  },

  moveCard(id, listId, position) {
    return api.patch(`/cards/${id}/move/`, { list_id: listId, position })
  }
}
