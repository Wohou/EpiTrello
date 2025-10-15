import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Board endpoints
export const boardAPI = {
  getAll: () => api.get('/boards'),
  getOne: (id) => api.get(`/boards/${id}`),
  create: (data) => api.post('/boards', data),
  update: (id, data) => api.put(`/boards/${id}`, data),
  delete: (id) => api.delete(`/boards/${id}`)
};

// List endpoints
export const listAPI = {
  getAll: (boardId) => api.get(`/boards/${boardId}/lists`),
  getOne: (id) => api.get(`/boards/0/lists/${id}`),
  create: (boardId, data) => api.post(`/boards/${boardId}/lists`, data),
  update: (id, data) => api.put(`/boards/0/lists/${id}`, data),
  delete: (id) => api.delete(`/boards/0/lists/${id}`)
};

// Card endpoints
export const cardAPI = {
  getAll: (listId) => api.get(`/lists/${listId}/cards`),
  getOne: (id) => api.get(`/lists/0/cards/${id}`),
  create: (listId, data) => api.post(`/lists/${listId}/cards`, data),
  update: (id, data) => api.put(`/lists/0/cards/${id}`, data),
  delete: (id) => api.delete(`/lists/0/cards/${id}`)
};

export default api;
