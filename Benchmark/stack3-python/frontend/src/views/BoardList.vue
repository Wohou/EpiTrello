<template>
  <div class="board-list-container">
    <div class="board-list-header">
      <h2>Your Boards</h2>
      <button @click="openModal" class="btn btn-primary">
        ➕ Create Board
      </button>
    </div>

    <div v-if="loading" class="loading">Loading boards...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else class="boards-grid">
      <div
        v-for="board in boards.filter(b => b && b.id)"
        :key="board.id"
        class="board-card"
        @click="goToBoard(board.id)"
      >
        <h3>{{ board.title }} →</h3>
        <p class="board-description">{{ board.description || 'No description' }}</p>
        <div class="board-meta">
          <span>📋 {{ board.lists_count || 0 }} lists</span>
        </div>
        <button
          @click.stop="deleteBoard(board.id)"
          class="btn-delete"
          title="Delete board"
        >
          🗑️
        </button>
      </div>

      <div class="board-card board-card-empty" v-if="boards.length === 0">
        <p>No boards yet. Create your first board! 🚀</p>
      </div>
    </div>

    <!-- Create Board Modal -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <h3>Create New Board</h3>
        <form @submit.prevent="createBoard">
          <div class="form-group">
            <label>Board Title</label>
            <input
              v-model="newBoard.title"
              type="text"
              required
              placeholder="Enter board title"
              autofocus
            />
          </div>
          <div class="form-group">
            <label>Description (optional)</label>
            <textarea
              v-model="newBoard.description"
              placeholder="Enter board description"
              rows="3"
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn btn-primary">
              Create Board
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBoardStore } from '../stores/boardStore'

const router = useRouter()
const boardStore = useBoardStore()

const showCreateModal = ref(false)
const newBoard = ref({
  title: '',
  description: ''
})

const boards = computed(() => boardStore.boards)
const loading = computed(() => boardStore.loading)
const error = computed(() => boardStore.error)

onMounted(() => {
  console.log('BoardList mounted, fetching boards...')
  boardStore.fetchBoards()
})

const openModal = () => {
  console.log('Open modal button clicked')
  showCreateModal.value = true
  console.log('showCreateModal set to:', showCreateModal.value)
}

const closeModal = () => {
  console.log('Close modal called')
  showCreateModal.value = false
  newBoard.value = { title: '', description: '' }
}

const createBoard = async () => {
  console.log('createBoard called with:', newBoard.value)
  try {
    const board = await boardStore.createBoard(newBoard.value)
    console.log('Board created successfully:', board)
    newBoard.value = { title: '', description: '' }
    showCreateModal.value = false
    router.push(`/board/${board.id}`)
  } catch (error) {
    console.error('Failed to create board:', error)
    alert('Failed to create board: ' + error.message)
  }
}

const deleteBoard = async (id) => {
  if (confirm('Are you sure you want to delete this board?')) {
    try {
      await boardStore.deleteBoard(id)
    } catch (error) {
      alert('Failed to delete board')
    }
  }
}

const goToBoard = (id) => {
  router.push(`/board/${id}`)
}
</script>

<style scoped>
.board-list-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.board-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.board-list-header h2 {
  font-size: 2rem;
  color: #333;
}

.boards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.board-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border: 2px solid transparent;
}

.board-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.3);
  border-color: #667eea;
}

.board-card h3 {
  margin-bottom: 0.5rem;
  color: #667eea;
  font-weight: 600;
}

.board-description {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.board-meta {
  color: #999;
  font-size: 0.85rem;
}

.board-card-empty {
  background: #f9f9f9;
  border: 2px dashed #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
}

.board-card-empty:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
}

.btn-delete {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-delete:hover {
  opacity: 1;
}

.loading, .error {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
}

.error {
  color: #e74c3c;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  width: 90%;
  max-width: 500px;
}

.modal h3 {
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
</style>
