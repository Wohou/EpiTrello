# Architecture Documentation - Stack 1 (Next.js + Supabase)

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

Stack 1 implements a **modern integrated architecture** using Next.js 14 with App Router and Supabase as a Backend-as-a-Service (BaaS). This architecture emphasizes **rapid development**, **built-in real-time capabilities**, and **reduced infrastructure complexity**.

### Key Characteristics
- **Integrated Full-Stack**: Single codebase for frontend and backend
- **App Router**: Next.js 14 server/client component architecture
- **Backend-as-a-Service**: Supabase handles database, auth, and real-time
- **PostgreSQL**: Robust relational database with full SQL support
- **TypeScript-First**: Type safety across the entire application
- **Serverless API**: API routes deployed as serverless functions

---

## Technology Stack

### Application Layer
```
┌─────────────────────────────────────┐
│         Next.js 14                  │
│  ┌───────────────────────────────┐  │
│  │  App Router                   │  │
│  │  - Server Components          │  │
│  │  - Client Components          │  │
│  │  - API Routes                 │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  React 18                     │  │
│  │  - Server-side rendering      │  │
│  │  - Static generation          │  │
│  │  - Client interactivity       │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Backend-as-a-Service Layer
```
┌─────────────────────────────────────┐
│         Supabase                    │
│  ┌───────────────────────────────┐  │
│  │  PostgreSQL Database          │  │
│  │  - Relational structure       │  │
│  │  - ACID compliance            │  │
│  │  - Advanced queries           │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Supabase Client SDK          │  │
│  │  - Auto-generated REST API    │  │
│  │  - Real-time subscriptions    │  │
│  │  - Type-safe queries          │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Supabase Auth                │  │
│  │  - User authentication        │  │
│  │  - Row Level Security         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Data Client
```
┌─────────────────────────────────────┐
│    @supabase/supabase-js            │
│  ┌───────────────────────────────┐  │
│  │  Query Builder                │  │
│  │  - Select, Insert, Update     │  │
│  │  - Delete operations          │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Real-time Client             │  │
│  │  - WebSocket connection       │  │
│  │  - Subscribe to changes       │  │
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
         │     NEXT.JS APPLICATION CONTAINER              │
         │        (Integrated Frontend + Backend)         │
         │                                                │
         │  ┌──────────────────────────────────────┐      │
         │  │  App Router (Next.js 14)             │      │
         │  │                                      │      │
         │  │  /app                                │      │
         │  │  ├── page.tsx (Home - Server Comp)   │      │
         │  │  ├── boards/                         │      │
         │  │  │   └── page.tsx (Board List)       │      │
         │  │  └── boards/[id]/                    │      │
         │  │      └── page.tsx (Board View)       │      │
         │  └──────────────────────────────────────┘      │
         │                                                │
         │  ┌──────────────────────────────────────┐      │
         │  │  API Routes (Serverless Functions)   │      │
         │  │                                      │      │
         │  │  /app/api                            │      │
         │  │  ├── boards/                         │      │
         │  │  │   ├── route.ts (GET, POST)        │      │
         │  │  │   └── [id]/route.ts (GET, PUT,    │      │
         │  │  │                      DELETE)      │      │
         │  │  ├── lists/                          │      │
         │  │  │   ├── route.ts (GET, POST)        │      │
         │  │  │   └── [id]/route.ts (GET, PUT,    │      │
         │  │  │                      DELETE)      │      │
         │  │  └── cards/                          │      │
         │  │      ├── route.ts (GET, POST)        │      │
         │  │      └── [id]/route.ts (GET, PUT,    │      │
         │  │                          DELETE)     │      │
         │  └──────────────────────────────────────┘      │
         │                                                │
         │  ┌──────────────────────────────────────┐      │
         │  │  Components                          │      │
         │  │                                      │      │
         │  │  /app/components                     │      │
         │  │  ├── BoardCard.tsx (Client)          │      │
         │  │  ├── CreateBoard.tsx (Client)        │      │
         │  │  ├── ListColumn.tsx (Client)         │      │
         │  │  ├── CardItem.tsx (Client)           │      │
         │  │  └── CreateCard.tsx (Client)         │      │
         │  └──────────────────────────────────────┘      │
         │                                                │
         │  ┌──────────────────────────────────────┐      │
         │  │  Supabase Client                     │      │
         │  │                                      │      │
         │  │  /lib/supabase.ts                    │      │
         │  │  - createClient()                    │      │
         │  │  - Environment config                │      │
         │  └──────────────────────────────────────┘      │
         │                                                │
         │            Port: 3000                          │
         └────────────────────┬───────────────────────────┘
                              │
                              │ HTTPS REST API
                              │ WebSocket (Real-time)
                              │
         ┌────────────────────▼───────────────────────────┐
         │          SUPABASE (Cloud BaaS)                 │
         │        https://your-project.supabase.co        │
         │                                                │
         │  ┌──────────────────────────────────────┐      │
         │  │  PostgreSQL Database                 │      │
         │  │                                      │      │
         │  │  Tables:                             │      │
         │  │  ├── boards                          │      │
         │  │  │   ├── id (uuid, PK)               │      │
         │  │  │   ├── title (text)                │      │
         │  │  │   ├── description (text)          │      │
         │  │  │   ├── created_at (timestamp)      │      │
         │  │  │   └── updated_at (timestamp)      │      │
         │  │  │                                   │      │
         │  │  ├── lists                           │      │
         │  │  │   ├── id (uuid, PK)               │      │
         │  │  │   ├── title (text)                │      │
         │  │  │   ├── position (integer)          │      │
         │  │  │   ├── board_id (uuid, FK)         │      │
         │  │  │   ├── created_at (timestamp)      │      │
         │  │  │   └── updated_at (timestamp)      │      │
         │  │  │                                   │      │
         │  │  └── cards                           │      │
         │  │      ├── id (uuid, PK)               │      │
         │  │      ├── title (text)                │      │
         │  │      ├── description (text)          │      │
         │  │      ├── position (integer)          │      │
         │  │      ├── list_id (uuid, FK)          │      │
         │  │      ├── created_at (timestamp)      │      │
         │  │      └── updated_at (timestamp)      │      │
         │  └──────────────────────────────────────┘      │
         │                                                │
         │  ┌──────────────────────────────────────┐      │
         │  │  Auto-Generated REST API             │      │
         │  │  - GET /rest/v1/boards               │      │
         │  │  - POST /rest/v1/boards              │      │
         │  │  - PATCH /rest/v1/boards?id=eq.x     │      │
         │  │  - DELETE /rest/v1/boards?id=eq.x    │      │
         │  └──────────────────────────────────────┘      │
         │                                                │
         │  ┌──────────────────────────────────────┐      │
         │  │  Real-time Engine                    │      │
         │  │  - PostgreSQL replication            │      │
         │  │  - WebSocket broadcasts              │      │
         │  │  - Row-level subscriptions           │      │
         │  └──────────────────────────────────────┘      │
         │                                                │
         │  ┌──────────────────────────────────────┐      │
         │  │  Row Level Security (RLS)            │      │
         │  │  - Policy-based access control       │      │
         │  │  - Per-table security rules          │      │
         │  └──────────────────────────────────────┘      │
         └────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Page Load (Server-Side Rendering)

```
User → Next.js Page (Server Component)
         │
         ├─→ Supabase Client (Server-side)
         │    │
         │    └─→ Supabase API (HTTPS)
         │         │
         │         └─→ PostgreSQL Query
         │              │
         │              └─→ Return Data
         │
         └─→ Render HTML with Data
              │
              └─→ Send to Browser (Hydrated React)
```

### 2. Client-Side Interaction (Create Board)

```
User clicks "Create Board"
         │
         └─→ Client Component (React)
              │
              └─→ POST /api/boards (API Route)
                   │
                   ├─→ Supabase Client (Server-side)
                   │    │
                   │    └─→ INSERT INTO boards
                   │         │
                   │         └─→ PostgreSQL
                   │              │
                   │              └─→ Return new board
                   │
                   └─→ JSON Response to Client
                        │
                        └─→ Update UI (React State)
```

### 3. Real-time Update (Collaborative Features)

```
User A creates a card
         │
         └─→ API Route: POST /api/cards
              │
              └─→ Supabase: INSERT INTO cards
                   │
                   └─→ PostgreSQL replication triggers
                        │
                        └─→ Supabase Real-time broadcasts
                             │
                             ├─→ User B's WebSocket connection
                             │    │
                             │    └─→ Update User B's UI
                             │
                             └─→ User C's WebSocket connection
                                  │
                                  └─→ Update User C's UI
```

---

## Component Structure

### Server Components (No Client JavaScript)

```
/app
├── page.tsx                    # Home page (redirect to boards)
├── layout.tsx                  # Root layout with metadata
└── boards
    ├── page.tsx                # Board list (SSR data fetching)
    └── [id]
        └── page.tsx            # Board view (SSR with dynamic params)
```

### Client Components (Interactive)

```
/app/components
├── BoardCard.tsx               # Board preview card with actions
├── CreateBoardModal.tsx        # Modal form for creating boards
├── ListColumn.tsx              # List container with cards
├── CardItem.tsx                # Individual card display
├── CreateListButton.tsx        # Button to add new list
└── CreateCardButton.tsx        # Button to add new card
```

### API Routes (Serverless Functions)

```
/app/api
├── boards
│   ├── route.ts                # GET (all), POST (create)
│   └── [id]
│       └── route.ts            # GET (one), PUT (update), DELETE
├── lists
│   ├── route.ts                # GET (filtered), POST (create)
│   └── [id]
│       └── route.ts            # GET (one), PUT (update), DELETE
└── cards
    ├── route.ts                # GET (filtered), POST (create)
    └── [id]
        └── route.ts            # GET (one), PUT (update), DELETE
```

---

## API Design

### RESTful Endpoints

#### Boards

**GET /api/boards**
```typescript
Response: Board[]
[
  {
    id: "uuid",
    title: "My Board",
    description: "Board description",
    created_at: "2025-10-15T...",
    updated_at: "2025-10-15T..."
  }
]
```

**GET /api/boards/:id**
```typescript
Response: Board with lists and cards
{
  id: "uuid",
  title: "My Board",
  description: "Board description",
  lists: [
    {
      id: "uuid",
      title: "To Do",
      position: 0,
      cards: [...]
    }
  ]
}
```

**POST /api/boards**
```typescript
Request: { title: string, description?: string }
Response: Board (created)
```

**PUT /api/boards/:id**
```typescript
Request: { title?: string, description?: string }
Response: Board (updated)
```

**DELETE /api/boards/:id**
```typescript
Response: { success: boolean }
// Cascades to lists and cards via database constraints
```

#### Lists

**GET /api/lists?boardId=:id**
```typescript
Response: List[]
```

**POST /api/lists**
```typescript
Request: { title: string, board_id: string, position: number }
Response: List (created)
```

**PUT /api/lists/:id**
```typescript
Request: { title?: string, position?: number }
Response: List (updated)
```

**DELETE /api/lists/:id**
```typescript
Response: { success: boolean }
// Cascades to cards via database constraints
```

#### Cards

**GET /api/cards?listId=:id**
```typescript
Response: Card[]
```

**POST /api/cards**
```typescript
Request: { title: string, description?: string, list_id: string, position: number }
Response: Card (created)
```

**PUT /api/cards/:id**
```typescript
Request: { title?: string, description?: string, position?: number }
Response: Card (updated)
```

**DELETE /api/cards/:id**
```typescript
Response: { success: boolean }
```

---

## Database Schema

### PostgreSQL Tables

```sql
-- Boards table
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lists table
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards table
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  position INTEGER DEFAULT 0,
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lists_board_id ON lists(board_id);
CREATE INDEX idx_cards_list_id ON cards(list_id);
```

### Relationships

```
boards (1) ──< (many) lists
                │
                └──< (many) cards
```

- **CASCADE DELETE**: Deleting a board removes all its lists and cards
- **CASCADE DELETE**: Deleting a list removes all its cards
- **Foreign Keys**: Enforce referential integrity

---

## Docker Architecture

### Single Container Setup

```
┌─────────────────────────────────────┐
│     Docker Container                │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Next.js Application          │  │
│  │  - Node.js 18 runtime         │  │
│  │  - npm dependencies           │  │
│  │  - App Router pages           │  │
│  │  - API routes                 │  │
│  │  - Static assets              │  │
│  └───────────────────────────────┘  │
│                                     │
│  Environment Variables:             │
│  - NEXT_PUBLIC_SUPABASE_URL         │
│  - NEXT_PUBLIC_SUPABASE_ANON_KEY    │
│                                     │
│  Port Mapping: 3000:3000            │
└─────────────────────────────────────┘
         │
         │ HTTPS
         │
         ▼
┌─────────────────────────────────────┐
│     Supabase (External Cloud)       │
│  - PostgreSQL database              │
│  - Real-time engine                 │
│  - Authentication                   │
└─────────────────────────────────────┘
```

### Dockerfile Structure

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
```

---

## Key Advantages

### 1. Simplified Architecture
- **Single Codebase**: No separate frontend/backend repositories
- **Unified Deployment**: Deploy entire application as one unit
- **Shared Types**: TypeScript types across client and server

### 2. Rapid Development
- **No Backend Boilerplate**: Supabase handles database, auth, real-time
- **Auto-Generated API**: Database tables automatically expose REST endpoints
- **Built-in Features**: Authentication, storage, real-time out of the box

### 3. Performance
- **Server-Side Rendering**: Faster initial page loads
- **Static Generation**: Pre-render pages at build time
- **Edge Functions**: Deploy API routes globally

### 4. Scalability
- **Serverless API Routes**: Auto-scaling based on demand
- **Managed Database**: Supabase handles scaling and backups
- **CDN Distribution**: Next.js optimizes asset delivery

### 5. Developer Experience
- **Hot Reload**: Instant feedback during development
- **TypeScript Support**: End-to-end type safety
- **Modern Tooling**: Latest React and Next.js features

---
