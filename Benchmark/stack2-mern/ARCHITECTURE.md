# Architecture Documentation - Stack 2 (MERN)

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Data Flow](#data-flow)
5. [Component Structure](#component-structure)
6. [API Design](#api-design)
7. [Database Schema](#database-schema)
8. [Docker Architecture](#docker-architecture)

---

## Overview

Stack 2 implements a **traditional MERN architecture** with complete separation of concerns between frontend, backend, and database layers. This architecture emphasizes **flexibility**, **scalability**, and **full JavaScript ecosystem**.

### Key Characteristics
- **Full JavaScript**: Same language across the entire stack
- **Separation of Concerns**: Clear boundaries between layers
- **RESTful API**: Standard HTTP methods and endpoints
- **Document Database**: Flexible schema with MongoDB
- **Component-Based UI**: React functional components with hooks
- **Containerized**: All services run in Docker containers

---

## Technology Stack

### Frontend Layer
```
┌─────────────────────────────────────┐
│         React 18.2.0                │
│  ┌───────────────────────────────┐  │
│  │  React Router 6.20.1          │  │
│  │  (Client-side routing)        │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Axios 1.6.2                  │  │
│  │  (HTTP client)                │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Vite 5.0.8                   │  │
│  │  (Build tool & dev server)    │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Backend Layer
```
┌─────────────────────────────────────┐
│       Node.js 18                    │
│  ┌───────────────────────────────┐  │
│  │  Express.js 4.18.2            │  │
│  │  (Web framework)              │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Mongoose 8.0.3               │  │
│  │  (MongoDB ODM)                │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  CORS 2.8.5                   │  │
│  │  (Cross-origin support)       │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Database Layer
```
┌─────────────────────────────────────┐
│         MongoDB 7                   │
│  ┌───────────────────────────────┐  │
│  │  Document Store               │  │
│  │  - Flexible schema            │  │
│  │  - JSON-like documents        │  │
│  │  - Indexing support           │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                      http://localhost:3000                      │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 │ HTTP Requests
                                 │
         ┌───────────────────────▼────────────────────────┐
         │          FRONTEND CONTAINER                    │
         │         (React + Vite)                         │
         │                                                │
         │  ┌──────────────────────────────────────┐      │
         │  │  React Application                   │      │
         │  │  - BoardList Component               │      │
         │  │  - BoardView Component               │      │
         │  │  - React Router                      │      │
         │  └──────────────────────────────────────┘      │
         │                                                │
         │  ┌──────────────────────────────────────┐      │
         │  │  Vite Dev Server                     │      │
         │  │  - Hot Module Replacement            │      │
         │  │  - Proxy: /api → backend:5000        │      │
         │  └──────────────────────────────────────┘      │
         │                                                │
         │            Port: 3000                          │
         └────────────────────┬───────────────────────────┘
                              │
                              │ /api/* requests
                              │ (proxied by Vite)
                              │
         ┌────────────────────▼───────────────────────────┐
         │          BACKEND CONTAINER                     │
         │       (Express.js + Node.js)                   │
         │                                                │
         │  ┌──────────────────────────────────────┐      │
         │  │  Express Server                      │      │
         │  │  - CORS middleware                   │      │
         │  │  - JSON body parser                  │      │
         │  │  - Request logging                   │      │
         │  │  - Error handling                    │      │
         │  └──────────────────────────────────────┘      │
         │                                                │
         │  ┌──────────────────────────────────────┐      │
         │  │  REST API Routes                     │      │
         │  │  - /api/boards                       │      │
         │  │  - /api/boards/:id/lists             │      │
         │  │  - /api/lists/:id/cards              │      │
         │  └──────────────────────────────────────┘      │
         │                                                │
         │  ┌──────────────────────────────────────┐      │
         │  │  Controllers                         │      │
         │  │  - boardController.js                │      │
         │  │  - listController.js                 │      │
         │  │  - cardController.js                 │      │
         │  └──────────────────────────────────────┘      │
         │                                                │
         │  ┌──────────────────────────────────────┐      │
         │  │  Mongoose ODM                        │      │
         │  │  - Schema validation                 │      │
         │  │  - Query builders                    │      │
         │  │  - Middleware hooks                  │      │
         │  └──────────────────────────────────────┘      │
         │                                                │
         │            Port: 5000                          │
         └────────────────────┬───────────────────────────┘
                              │
                              │ MongoDB Protocol
                              │ (Mongoose connection)
                              │
         ┌────────────────────▼───────────────────────────┐
         │         DATABASE CONTAINER                     │
         │            (MongoDB)                           │
         │                                                │
         │  ┌──────────────────────────────────────┐      │
         │  │  MongoDB Server                      │      │
         │  │  - Database: trello                  │      │
         │  │  - Collections:                      │      │
         │  │    • boards                          │      │
         │  │    • lists                           │      │
         │  │    • cards                           │      │
         │  └──────────────────────────────────────┘      │
         │                                                │
         │  ┌──────────────────────────────────────┐      │
         │  │  Persistent Storage                  │      │
         │  │  - Docker volume: mongodb_data       │      │
         │  │  - Path: /data/db                    │      │
         │  └──────────────────────────────────────┘      │
         │                                                │
         │            Port: 27017                         │
         └────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    DOCKER NETWORK: trello-network               │
│            All containers communicate via this bridge           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Create Board Flow
```
1. User clicks "Create Board" button
   │
   ▼
2. React component opens modal
   │
   ▼
3. User fills form and submits
   │
   ▼
4. Component calls: boardAPI.create(data)
   │
   ▼
5. Axios sends: POST /api/boards
   │
   ▼
6. Vite proxy forwards to: http://backend:5000/api/boards
   │
   ▼
7. Express router matches route
   │
   ▼
8. boardController.createBoard() executes
   │
   ▼
9. Mongoose creates new Board document
   │
   ▼
10. MongoDB saves document and returns ID
    │
    ▼
11. Controller returns JSON response
    │
    ▼
12. Axios receives response
    │
    ▼
13. Component updates state with new board
    │
    ▼
14. React re-renders with new board in list
    │
    ▼
15. User navigates to new board
```

### Get Board with Lists and Cards Flow
```
1. User clicks on a board card
   │
   ▼
2. React Router navigates to /board/:id
   │
   ▼
3. BoardView component mounts
   │
   ▼
4. useEffect calls: boardAPI.getOne(id)
   │
   ▼
5. Axios sends: GET /api/boards/:id
   │
   ▼
6. Express routes to boardController.getBoard()
   │
   ▼
7. Controller queries:
   ├─ Board.findById(id)
   └─ List.find({ board: id }).populate('cards')
   │
   ▼
8. Mongoose executes queries:
   ├─ Finds board document
   ├─ Finds all lists for that board
   └─ Populates each list with its cards
   │
   ▼
9. Controller constructs response:
   {
     board: {...},
     lists: [
       { ..., cards: [...] },
       { ..., cards: [...] }
     ]
   }
   │
   ▼
10. JSON response sent to frontend
    │
    ▼
11. Component receives data
    │
    ▼
12. State updated: setBoard() and setLists()
    │
    ▼
13. React renders board with all lists and cards
```

---

## Component Structure

### Frontend Component Hierarchy
```
App
├── Header (static)
└── Routes
    ├── / → BoardList
    │   ├── Board List Header
    │   ├── Boards Grid
    │   │   └── Board Cards (map)
    │   │       ├── Board Info
    │   │       └── Delete Button
    │   └── Create Board Modal (conditional)
    │       └── Form
    └── /board/:id → BoardView
        ├── Board Header
        │   ├── Back Button
        │   └── Board Info
        ├── Lists Container
        │   ├── List Components (map)
        │   │   ├── List Header
        │   │   ├── Cards Container
        │   │   │   └── Card Components (map)
        │   │   └── Add Card Button
        │   └── Add List Button
        ├── Create List Modal (conditional)
        └── Create Card Modal (conditional)
```

### Backend Request Flow
```
Express Server
├── Middleware Layer
│   ├── CORS
│   ├── JSON Parser
│   ├── URL Encoded Parser
│   └── Request Logger
│
├── Routes Layer
│   ├── /api/boards → boardRoutes
│   ├── /api/boards/:boardId/lists → listRoutes
│   └── /api/lists/:listId/cards → cardRoutes
│
├── Controller Layer
│   ├── boardController
│   │   ├── getAllBoards()
│   │   ├── getBoard()
│   │   ├── createBoard()
│   │   ├── updateBoard()
│   │   └── deleteBoard()
│   ├── listController
│   │   ├── getAllLists()
│   │   ├── createList()
│   │   ├── updateList()
│   │   └── deleteList()
│   └── cardController
│       ├── getAllCards()
│       ├── createCard()
│       ├── updateCard()
│       └── deleteCard()
│
└── Model Layer (Mongoose)
    ├── Board Model
    ├── List Model
    └── Card Model
```

---

## API Design

### RESTful Endpoints

#### Board Endpoints
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/boards` | Get all boards | - | `[{Board}]` |
| GET | `/api/boards/:id` | Get board with lists & cards | - | `{Board, lists: [{List, cards: []}]}` |
| POST | `/api/boards` | Create new board | `{title, description?}` | `{Board}` |
| PUT | `/api/boards/:id` | Update board | `{title?, description?}` | `{Board}` |
| DELETE | `/api/boards/:id` | Delete board (cascades) | - | `{message}` |

#### List Endpoints
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/boards/:boardId/lists` | Get all lists for board | - | `[{List}]` |
| POST | `/api/boards/:boardId/lists` | Create new list | `{title, position?}` | `{List}` |
| PUT | `/api/boards/0/lists/:id` | Update list | `{title?, position?}` | `{List}` |
| DELETE | `/api/boards/0/lists/:id` | Delete list (cascades) | - | `{message}` |

#### Card Endpoints
| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/api/lists/:listId/cards` | Get all cards for list | - | `[{Card}]` |
| POST | `/api/lists/:listId/cards` | Create new card | `{title, description?, position?}` | `{Card}` |
| PUT | `/api/lists/0/cards/:id` | Update card | `{title?, description?, position?, list?}` | `{Card}` |
| DELETE | `/api/lists/0/cards/:id` | Delete card | - | `{message}` |

### Response Formats

**Success Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "My Board",
  "description": "Project tasks",
  "createdAt": "2025-10-15T10:00:00.000Z",
  "updatedAt": "2025-10-15T10:00:00.000Z"
}
```

**Error Response:**
```json
{
  "message": "Board not found"
}
```

---

## Database Schema

### MongoDB Collections

#### boards Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  title: "My Project",
  description: "Project management board",
  createdAt: ISODate("2025-10-15T10:00:00Z"),
  updatedAt: ISODate("2025-10-15T10:00:00Z")
}
```

**Indexes:**
- `_id`: Primary key (automatic)

**Virtuals:**
- `lists_count`: Counts related lists (computed)

#### lists Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439012"),
  title: "To Do",
  position: 0,
  board: ObjectId("507f1f77bcf86cd799439011"),
  createdAt: ISODate("2025-10-15T10:01:00Z"),
  updatedAt: ISODate("2025-10-15T10:01:00Z")
}
```

**Indexes:**
- `_id`: Primary key (automatic)
- `{board: 1, position: 1}`: Compound index for efficient queries

**Virtuals:**
- `cards_count`: Counts related cards (computed)

#### cards Collection
```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439013"),
  title: "Implement authentication",
  description: "Add JWT-based auth system",
  position: 0,
  list: ObjectId("507f1f77bcf86cd799439012"),
  createdAt: ISODate("2025-10-15T10:02:00Z"),
  updatedAt: ISODate("2025-10-15T10:02:00Z")
}
```

**Indexes:**
- `_id`: Primary key (automatic)
- `{list: 1, position: 1}`: Compound index for efficient queries

### Relationships
```
Board (1) ────┐
              │
              ▼ (many)
            List (1) ────┐
                         │
                         ▼ (many)
                       Card
```

### Cascade Delete Behavior
```
Delete Board
└─► Finds all Lists with board = Board._id
    └─► Deletes all Lists
        └─► Finds all Cards with list IN [List._ids]
            └─► Deletes all Cards
```

---

## Docker Architecture

### Service Dependencies
```
        ┌──────────────┐
        │   MongoDB    │
        │   (healthy)  │
        └──────┬───────┘
               │
               │ depends_on
               │ condition: service_healthy
               │
        ┌──────▼───────┐
        │   Backend    │
        │   (healthy)  │
        └──────┬───────┘
               │
               │ depends_on
               │ condition: service_healthy
               │
        ┌──────▼───────┐
        │   Frontend   │
        │   (running)  │
        └──────────────┘
```

### Health Checks

**MongoDB:**
```yaml
test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
interval: 10s
timeout: 5s
retries: 5
start_period: 10s
```

**Backend:**
```yaml
test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:5000/health"]
interval: 10s
timeout: 5s
retries: 5
start_period: 20s
```

### Network Communication
```
┌────────────────────────────────────────┐
│      Docker Network: trello-network    │
│            (Bridge mode)               │
│                                        │
│  mongodb:27017 ◄──┐                    │
│                   │                    │
│  backend:5000  ───┘                    │
│       ▲                                │
│       │                                │
│  frontend:3000                         │
│                                        │
└────────────────────────────────────────┘
         ▲
         │ Port Mapping
         │
┌────────┴────────┐
│   localhost     │
│  :3000 (UI)     │
│  :5000 (API)    │
│  :27017 (DB)    │
└─────────────────┘
```

### Volume Persistence
```
mongodb_data volume
└─► /data/db (in container)
    ├─► WiredTiger storage engine
    ├─► Database files
    └─► Journal files

Persists across:
 docker-compose restart
 docker-compose stop/start
 Container recreation

Removed only with:
    docker-compose down -v
```

---

