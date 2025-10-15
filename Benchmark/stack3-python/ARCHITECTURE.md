# Stack 3 - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USER BROWSER                        │
│                     (http://localhost:3000)                 │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   Vue.js App     │
                    │   (Frontend)     │
                    │                  │
                    │  - Vue Router    │
                    │  - Pinia Store   │
                    │  - Components    │
                    └────────┬─────────┘
                             │
                    HTTP/REST API
                    (Axios Client)
                             │
                    ┌────────▼─────────┐
                    │  Django Backend  │
                    │                  │
                    │  - DRF ViewSets  │
                    │  - Serializers   │
                    │  - URL Routing   │
                    └────────┬─────────┘
                             │
                     ORM (Django)
                             │
                    ┌────────▼─────────┐
                    │   PostgreSQL     │
                    │    Database      │
                    │                  │
                    │  - Boards        │
                    │  - Lists         │
                    │  - Cards         │
                    └──────────────────┘
```

---

## Data Flow

### Creating a Card Example

```
1. User Action (Frontend)
   └─> Click "Add Card" button in BoardView.vue

2. Component Method
   └─> createCard() in BoardView.vue
       └─> Calls boardStore.createCard()

3. Pinia Store
   └─> boardStore.createCard() in boardStore.js
       └─> Calls api.createCard()

4. API Service
   └─> api.createCard() in api.js
       └─> POST request to http://localhost:8000/api/cards/

5. Django Backend
   └─> CardViewSet.create() in views.py
       └─> CardSerializer validates data
           └─> Card.objects.create() saves to database

6. Database
   └─> PostgreSQL stores card record

7. Response Path (Reverse)
   └─> Django returns serialized Card object
       └─> API service receives response
           └─> Pinia store updates state
               └─> Vue component re-renders
                   └─> User sees new card!
```

---

## Request/Response Flow

### GET Board Details

```
GET /api/boards/1/

Frontend:
┌──────────────────────────┐
│ router.push('/board/1')  │
│ BoardView.vue mounted    │
│ boardStore.fetchBoard(1) │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│ api.getBoard(1)          │
│ GET /api/boards/1/       │
└─────────┬────────────────┘
          │
          ▼
Backend:
┌──────────────────────────┐
│ BoardViewSet.retrieve()  │
│ SELECT * FROM boards     │
│ WHERE id = 1             │
│ + Prefetch lists, cards  │
└─────────┬────────────────┘
          │
          ▼
Response:
┌──────────────────────────┐
│ {                        │
│   "id": 1,               │
│   "title": "My Board",   │
│   "lists": [             │
│     {                    │
│       "id": 1,           │
│       "title": "To Do",  │
│       "cards": [...]     │
│     }                    │
│   ]                      │
│ }                        │
└─────────┬────────────────┘
          │
          ▼
Frontend:
┌──────────────────────────┐
│ boardStore updates       │
│ Component re-renders     │
│ User sees board!         │
└──────────────────────────┘
```

---

## Component Hierarchy

```
App.vue (Root)
│
├─── Header (Inline)
│    └─── Title & Navigation
│
└─── <router-view>
     │
     ├─── BoardList.vue (/)
     │    │
     │    ├─── Board Cards Grid
     │    │    └─── Individual Board Cards
     │    │
     │    └─── Create Board Modal
     │         └─── Form
     │
     └─── BoardView.vue (/board/:id)
          │
          ├─── Board Header
          │    └─── Title & Back Button
          │
          └─── Lists Container
               │
               ├─── List Component (v-for)
               │    │
               │    ├─── List Header
               │    │
               │    ├─── Cards Container
               │    │    └─── Card Component (v-for)
               │    │         ├─── Card Content
               │    │         └─── Delete Button
               │    │
               │    └─── Add Card Form
               │
               └─── Add List Form
```

---

## Database Schema with Relationships

```
┌──────────────────────┐
│       Board          │
│──────────────────────│
│ id (PK)              │
│ title                │
│ description          │
│ created_at           │
│ updated_at           │
└──────────┬───────────┘
           │
           │ One-to-Many
           │
     ┌─────▼──────────────┐
     │                    │
     │                    │
┌────▼─────────────┐      │
│      List        │      │
│──────────────────│      │
│ id (PK)          │      │
│ board_id (FK) ───┼──────┘
│ title            │
│ position         │
│ created_at       │
│ updated_at       │
└──────────┬───────┘
           │
           │ One-to-Many
           │
     ┌─────▼──────────────┐
     │                    │
     │                    │
┌────▼─────────────┐      │
│      Card        │      │
│──────────────────│      │
│ id (PK)          │      │
│ list_id (FK) ────┼──────┘
│ title            │
│ description      │
│ position         │
│ created_at       │
│ updated_at       │
└──────────────────┘
```

---

## API Endpoint Structure

```
/api/
├── boards/
│   ├── GET    /           (List all boards)
│   ├── POST   /           (Create board)
│   ├── GET    /{id}/      (Get board detail)
│   ├── PUT    /{id}/      (Update board)
│   └── DELETE /{id}/      (Delete board)
│
├── lists/
│   ├── GET    /           (List all lists)
│   ├── GET    /?board=1   (Filter by board)
│   ├── POST   /           (Create list)
│   ├── PUT    /{id}/      (Update list)
│   ├── DELETE /{id}/      (Delete list)
│   └── PATCH  /{id}/update_position/  (Update position)
│
└── cards/
    ├── GET    /           (List all cards)
    ├── GET    /?list=1    (Filter by list)
    ├── POST   /           (Create card)
    ├── PUT    /{id}/      (Update card)
    ├── DELETE /{id}/      (Delete card)
    └── PATCH  /{id}/move/ (Move card)
```

---

## Docker Architecture

```
docker-compose.yml
│
├── db (PostgreSQL)
│   └── Image: postgres:15-alpine
│   └── Port: 5432
│   └── Volume: postgres_data
│
├── backend (Django)
│   └── Build: ./backend/Dockerfile
│   └── Port: 8000
│   └── Depends: db
│   └── Environment: Database credentials
│
└── frontend (Vue.js)
    └── Build: ./frontend/Dockerfile
    └── Port: 3000
    └── Depends: backend
```

---

## State Management Flow (Pinia)

```
┌─────────────────────────────────────┐
│         Pinia Store                 │
│       (boardStore.js)               │
│─────────────────────────────────────│
│                                     │
│  State:                             │
│  ├── boards: []                     │
│  ├── currentBoard: null             │
│  ├── loading: false                 │
│  └── error: null                    │
│                                     │
│  Actions:                           │
│  ├── fetchBoards()                  │
│  ├── fetchBoard(id)                 │
│  ├── createBoard(board)             │
│  ├── deleteBoard(id)                │
│  ├── createList(list)               │
│  ├── deleteList(id)                 │
│  ├── createCard(card)               │
│  └── deleteCard(listId, cardId)     │
│                                     │
└──────────┬──────────────────────────┘
           │
           ├──> Used by: BoardList.vue
           │    (boards, loading, error)
           │
           └──> Used by: BoardView.vue
                (currentBoard, loading, error)
```

---

## Deployment Architecture (Future)

```
┌──────────────────────────────────────┐
│         Cloud Provider               │
│         (AWS/GCP/Azure)              │
│                                      │
│  ┌────────────────────────────────┐  │
│  │     Load Balancer              │  │
│  └──────────┬─────────────────────┘  │
│             │                        │
│    ┌────────▼────────┐               │
│    │   Frontend      │               │
│    │   (Static CDN)  │               │
│    └────────┬────────┘               │
│             │                        │
│    ┌────────▼────────┐               │
│    │   Backend API   │               │
│    │   (Container)   │               │
│    └────────┬────────┘               │
│             │                        │
│    ┌────────▼────────┐               │
│    │   PostgreSQL    │               │
│    │   (Managed DB)  │               │
│    └─────────────────┘               │
│                                      │
└──────────────────────────────────────┘
```

---

