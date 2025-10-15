<template>
  <div class="board-view-container">
    <div v-if="loading" class="loading">Loading board...</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else-if="board" class="board-view">
      <div class="board-header">
        <div>
          <h2>{{ board.title }}</h2>
          <p class="board-description">{{ board.description }}</p>
        </div>
        <button @click="goBack" class="btn btn-secondary">
          ← Back to Boards
        </button>
      </div>

      <div class="lists-container">
        <div v-for="list in board.lists" :key="list.id" class="list">
          <div class="list-header">
            <h3>{{ list.title }}</h3>
            <button @click="deleteList(list.id)" class="btn-icon" title="Delete list">
              🗑️
            </button>
          </div>

          <div class="cards">
            <div
              v-for="card in list.cards"
              :key="card.id"
              class="card"
            >
              <div class="card-content">
                <h4>{{ card.title }}</h4>
                <p v-if="card.description">{{ card.description }}</p>
              </div>
              <button
                @click="deleteCard(list.id, card.id)"
                class="btn-icon card-delete"
                title="Delete card"
              >
                ✕
              </button>
            </div>
          </div>

          <button
            @click="showAddCard(list.id)"
            class="btn-add-card"
          >
            ➕ Add a card
          </button>

          <!-- Add Card Form -->
          <div v-if="addingCardToList === list.id" class="add-card-form">
            <input
              v-model="newCard.title"
              type="text"
              placeholder="Card title"
              @keyup.enter="createCard(list.id)"
              @keyup.esc="cancelAddCard"
            />
            <textarea
              v-model="newCard.description"
              placeholder="Description (optional)"
              rows="2"
            ></textarea>
            <div class="form-actions">
              <button @click="createCard(list.id)" class="btn btn-primary btn-sm">
                Add Card
              </button>
              <button @click="cancelAddCard" class="btn btn-secondary btn-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Add List Button -->
        <div class="list add-list">
          <button
            v-if="!showingAddList"
            @click="showingAddList = true"
            class="btn-add-list"
          >
            ➕ Add a list
          </button>

          <div v-else class="add-list-form">
            <input
              v-model="newList.title"
              type="text"
              placeholder="List title"
              @keyup.enter="createList"
              @keyup.esc="cancelAddList"
            />
            <div class="form-actions">
              <button @click="createList" class="btn btn-primary btn-sm">
                Add List
              </button>
              <button @click="cancelAddList" class="btn btn-secondary btn-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBoardStore } from '../stores/boardStore'

const route = useRoute()
const router = useRouter()
const boardStore = useBoardStore()

const showingAddList = ref(false)
const addingCardToList = ref(null)

const newList = ref({ title: '' })
const newCard = ref({ title: '', description: '' })

const board = computed(() => boardStore.currentBoard)
const loading = computed(() => boardStore.loading)
const error = computed(() => boardStore.error)

onMounted(() => {
  boardStore.fetchBoard(route.params.id)
})

const goBack = () => {
  router.push('/')
}

const createList = async () => {
  if (!newList.value.title.trim()) return

  try {
    await boardStore.createList({
      title: newList.value.title,
      board: route.params.id,
      position: board.value.lists.length
    })
    newList.value.title = ''
    showingAddList.value = false
  } catch (error) {
    alert('Failed to create list')
  }
}

const cancelAddList = () => {
  newList.value.title = ''
  showingAddList.value = false
}

const deleteList = async (listId) => {
  if (confirm('Are you sure you want to delete this list?')) {
    try {
      await boardStore.deleteList(listId)
    } catch (error) {
      alert('Failed to delete list')
    }
  }
}

const showAddCard = (listId) => {
  addingCardToList.value = listId
}

const createCard = async (listId) => {
  if (!newCard.value.title.trim()) return

  try {
    const list = board.value.lists.find(l => l.id === listId)
    await boardStore.createCard({
      title: newCard.value.title,
      description: newCard.value.description,
      list: listId,
      position: list.cards.length
    })
    newCard.value = { title: '', description: '' }
    addingCardToList.value = null
  } catch (error) {
    alert('Failed to create card')
  }
}

const cancelAddCard = () => {
  newCard.value = { title: '', description: '' }
  addingCardToList.value = null
}

const deleteCard = async (listId, cardId) => {
  if (confirm('Are you sure you want to delete this card?')) {
    try {
      await boardStore.deleteCard(listId, cardId)
    } catch (error) {
      alert('Failed to delete card')
    }
  }
}
</script>

<style scoped>
.board-view-container {
  min-height: calc(100vh - 180px);
  padding: 2rem;
}

.board-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.board-header h2 {
  font-size: 2rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.board-description {
  color: #666;
}

.lists-container {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  padding-bottom: 2rem;
}

.list {
  background: #ebecf0;
  border-radius: 8px;
  padding: 1rem;
  min-width: 300px;
  max-width: 300px;
  flex-shrink: 0;
  max-height: calc(100vh - 300px);
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.list-header h3 {
  font-size: 1.1rem;
  color: #333;
}

.cards {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.card {
  background: white;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  position: relative;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.card-content h4 {
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
  color: #333;
}

.card-content p {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
}

.card-delete {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.card:hover .card-delete {
  opacity: 0.6;
}

.card-delete:hover {
  opacity: 1 !important;
}

.btn-add-card {
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: #5e6c84;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.2s;
}

.btn-add-card:hover {
  background: rgba(9, 30, 66, 0.08);
}

.add-list {
  background: rgba(255, 255, 255, 0.24);
  display: flex;
  align-items: flex-start;
}

.btn-add-list {
  width: 100%;
  padding: 0.75rem;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  text-align: left;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.btn-add-list:hover {
  background: rgba(255, 255, 255, 0.16);
}

.add-card-form,
.add-list-form {
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
}

.add-card-form input,
.add-card-form textarea,
.add-list-form input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.form-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
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

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.btn-icon:hover {
  opacity: 1;
}

.loading,
.error {
  text-align: center;
  padding: 3rem;
  font-size: 1.1rem;
}

.error {
  color: #e74c3c;
}
</style>
