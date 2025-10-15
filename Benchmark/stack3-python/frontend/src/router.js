import { createRouter, createWebHistory } from 'vue-router'
import BoardList from './views/BoardList.vue'
import BoardView from './views/BoardView.vue'

const routes = [
  {
    path: '/',
    name: 'BoardList',
    component: BoardList
  },
  {
    path: '/board/:id',
    name: 'BoardView',
    component: BoardView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
