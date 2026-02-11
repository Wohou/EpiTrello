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

## GitHub Power-Up

The GitHub Power-Up is an integration that connects EpiTrello cards to GitHub issues, enabling bidirectional synchronization between the two platforms.

### Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                      GitHub Power-Up                             │
│                                                                  │
│  ┌──────────┐    ┌──────────────┐    ┌────────────────────────┐  │
│  │  Card UI  │───▶│ API Routes   │───▶│  GitHub API            │  │
│  │ (Popup)   │◀──│ /cards/[id]/ │◀──│  (repos, issues, hooks) │  │
│  └──────────┘    │   github     │    └────────────────────────┘  │
│       │          └──────────────┘              │                 │
│       │                │                       │                 │
│       │          ┌─────▼──────┐          ┌─────▼──────┐          │
│       │          │  Supabase  │          │  Webhook   │          │
│       └──────────│    DB      │◀─────────│  Listener  │          │
│    (broadcast)   │            │          │ /api/webhooks│         │
│                  └────────────┘          │  /github    │          │
│                                         └────────────┘          │
└──────────────────────────────────────────────────────────────────┘
```

### Features

| Feature | Description |
|---------|-------------|
| **Connect GitHub account** | OAuth link/unlink via Supabase Auth (`provider: 'github'`, scope `repo`) |
| **Link existing issue** | Browse user repos and select an open issue to attach to a card |
| **Create & link issue** | Create a new issue on GitHub and automatically link it |
| **Toggle issue state** | Open/close a linked issue directly from EpiTrello |
| **Unlink issue** | Remove the association between a card and an issue |
| **Auto-completion** | Card `is_completed` is set to `true` when **all** linked issues are closed |
| **Automatic webhooks** | A webhook is created on the GitHub repo the first time an issue is linked |
| **Real-time sync** | GitHub issue state changes are reflected on the board via Supabase Broadcast |

### Architecture

#### File Structure

```
app/
  api/
    github/
      connect/route.ts    # GitHub OAuth connection (GET/POST/DELETE)
      token/route.ts      # Proxy to get GitHub provider_token (GET)
    cards/[id]/
      github/route.ts     # Card-issue CRUD + webhook auto-creation (GET/POST/DELETE/PATCH)
    webhooks/
      github/route.ts     # Inbound GitHub webhook handler + broadcast (POST)
components/
  GitHubPowerUp.tsx       # UI popup (link, create, toggle, unlink)
  GitHubPowerUp.css       # Popup styles
lib/
  api-utils.ts            # requireAuth(), getGitHubIdentity(), getGitHubToken()
  github-utils.ts         # updateCardCompletion()
```

#### Database Tables

##### `card_github_links`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `card_id` | uuid | FK → `cards.id` |
| `github_type` | text | `'issue'` or `'pull_request'` |
| `github_repo_owner` | text | Repository owner (e.g. `octocat`) |
| `github_repo_name` | text | Repository name (e.g. `Hello-World`) |
| `github_number` | integer | Issue/PR number |
| `github_url` | text | Full URL to the issue on GitHub |
| `github_title` | text | Issue title at time of linking |
| `github_state` | text | `'open'` or `'closed'` (synced by webhook) |
| `synced_at` | timestamptz | Last sync timestamp |
| `created_by` | uuid | FK → `auth.users.id` |
| `created_at` | timestamptz | Creation timestamp |

**Unique constraint**: `(card_id, github_repo_owner, github_repo_name, github_number)` — prevents duplicate links.

##### `github_webhooks`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → `auth.users.id` |
| `repo_owner` | text | Repository owner |
| `repo_name` | text | Repository name |
| `webhook_id` | text | GitHub webhook ID |
| `is_active` | boolean | Whether the webhook is active |
| `last_ping_at` | timestamptz | Last ping timestamp |

**Unique constraint**: `(user_id, repo_owner, repo_name)` — one webhook per user per repo.

##### `cards.is_completed`

A boolean column on the `cards` table. Set to `true` when all linked issues are closed, `false` otherwise. Updated by `updateCardCompletion()`.

### API Endpoints

#### `GET /api/github/connect`

Check if the current user has GitHub linked.

**Response:**
```json
{
  "connected": true,
  "github_username": "octocat",
  "connected_at": "2024-01-01T00:00:00Z",
  "hasRepoScope": true
}
```

#### `POST /api/github/connect`

Initiate or verify GitHub connection. Returns `{ needsLinking: true }` if no GitHub identity, `{ needsReauth: true }` if token expired, or `{ success: true }` if already connected.

#### `DELETE /api/github/connect`

Unlinks the GitHub identity from the user's Supabase account and clears `github_username` from the profile.

#### `GET /api/github/token`

Returns the GitHub OAuth `provider_token` from the user's session. Used by the frontend to call the GitHub API directly.

**Response:**
```json
{ "token": "gho_xxx...", "username": "octocat" }
```

#### `GET /api/cards/[id]/github`

Returns all GitHub links for a card.

#### `POST /api/cards/[id]/github`

Links a GitHub issue to a card. Automatically calls `ensureWebhookExists()` to create a webhook on the repository if the user has admin access.

**Request body:**
```json
{
  "github_type": "issue",
  "github_repo_owner": "octocat",
  "github_repo_name": "Hello-World",
  "github_number": 42,
  "github_url": "https://github.com/octocat/Hello-World/issues/42",
  "github_title": "Fix bug",
  "github_state": "open"
}
```

**Response** includes `webhook` field indicating creation result:
- `{ "created": true }` — webhook created successfully
- `{ "reason": "already_exists" }` — webhook already present
- `{ "reason": "no_admin_permission" }` — user lacks admin access to the repo

#### `PATCH /api/cards/[id]/github`

Updates a link's `github_state` (called after toggling issue state from UI). Also triggers `updateCardCompletion()`.

#### `DELETE /api/cards/[id]/github?linkId=xxx`

Removes a card-issue link. Triggers `updateCardCompletion()`.

#### `POST /api/webhooks/github`

Receives inbound GitHub webhook events. Workflow:

1. **Verify signature** — HMAC-SHA256 with `GITHUB_WEBHOOK_SECRET`
2. **Handle `ping`** — Respond with `pong` (sent when webhook is first created)
3. **Handle `issues`** — For `opened`, `closed`, `reopened` actions:
   a. Find all `card_github_links` matching the repo + issue number
   b. Update `github_state` and `synced_at` on each matching link
   c. Call `updateCardCompletion()` for each affected card
   d. Find affected board IDs (card → list → board)
   e. **Broadcast** a `github-update` event to each board's Supabase channel

### Webhook Flow

```
GitHub (issue closed)
    │
    ▼
POST /api/webhooks/github
    │
    ├─ Verify HMAC-SHA256 signature
    │
    ├─ Find matching card_github_links
    │
    ├─ UPDATE card_github_links SET github_state='closed'
    │
    ├─ updateCardCompletion() → cards.is_completed = true/false
    │
    └─ Broadcast 'github-update' to board-{id} channels
         │
         ▼
    BoardView.tsx receives broadcast → re-fetches board data
```

### Real-Time Sync (Supabase Broadcast)

Since `postgres_changes` is not reliable in all Supabase environments, the real-time sync uses **Supabase Broadcast** as the transport mechanism:

**Server side** (`/api/webhooks/github/route.ts`):
1. After updating the DB, resolves board IDs for all affected cards
2. For each board, subscribes to channel `board-{boardId}`
3. Sends a broadcast event `github-update` with `{ action, issueNumber, newState }`
4. Cleans up the channel

**Client side** (`BoardView.tsx`):
- The board's realtime channel includes a `.on('broadcast', { event: 'github-update' }, callback)` listener
- When received, triggers a debounced full board data re-fetch

### Card Completion Logic

Implemented in `lib/github-utils.ts` → `updateCardCompletion()`:

```
IF card has no linked issues → is_completed = false
IF ALL linked issues have github_state = 'closed' → is_completed = true
IF ANY linked issue has github_state ≠ 'closed' → is_completed = false
```

This function is called on every operation that modifies links or states: link, unlink, toggle, webhook update.

### Auto-Webhook Creation

When a user links an issue to a card (`POST /api/cards/[id]/github`), `ensureWebhookExists()` runs:

1. Checks if a webhook already exists on the repo pointing to our endpoint
2. If not, creates one with `events: ['issues']` and the configured secret
3. Stores the webhook reference in `github_webhooks` table
4. Requires the user to have **admin** access to the repository

If the user doesn't have admin permissions, linking still works — only automatic webhook creation is skipped and a warning is logged.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (server-side only, used by webhook handler) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public app URL (used as webhook callback URL) |
| `GITHUB_WEBHOOK_SECRET` | Yes | Shared secret for HMAC-SHA256 webhook signature verification |

### Security

- **Webhook verification**: Every inbound webhook is verified via HMAC-SHA256 (`x-hub-signature-256` header) using `GITHUB_WEBHOOK_SECRET`
- **Service role isolation**: The webhook handler uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS, as it operates without a user session
- **Auth-protected API routes**: All `/api/github/*` and `/api/cards/[id]/github` routes require authentication via `requireAuth()`
- **Token proxying**: The GitHub `provider_token` is never exposed to the client directly — it's served via `/api/github/token` which requires auth
- **Unique constraints**: Database prevents duplicate issue links on the same card

---
