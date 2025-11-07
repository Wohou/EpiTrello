# EpiTrello - Stack 1 (Next.js + Supabase) - README

This is a **Trello-like application** built with **Next.js 14 and Supabase**. This project demonstrates a modern full-stack architecture with integrated frontend/backend and a Backend-as-a-Service database solution.

**See [Benchmark](../../Benchmark.md)** for more information on the other stack.<br>
**See [QUICKSTART](./QUICKSTART.md)** for an overview to test the program and the stack.

## TechStack

- **Framework**: Next.js 14 | React-based full-stack framework with App Router
- **Database**: Supabase (PostgreSQL) | Open-source Firebase alternative
- **Authentication**: Supabase Auth | Built-in authentication system
- **Real-time**: Supabase Realtime | WebSocket-based updates
- **Styling**: Custom CSS

## Quick Start

### Installation

1. **Navigate to the stack1-nextjs directory**
```powershell
cd Benchmark/stack1-nextjs
```

2. **Configure Supabase credentials**
  - Create a `.env.local` file in the project root
  - Add your Supabase URL and anon key:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Set up database schema**
  - Go to your Supabase project dashboard
  - Navigate to SQL Editor
  - Run the SQL schema from `supabase/schema.sql`

4. **Start the application with Docker Compose**
```powershell
docker-compose up --build
```

5. **Access the application**
- Application: http://localhost:3000
- API Routes: http://localhost:3000/api/*

### First Time Setup
The first time you run the application:
1. Ensure your Supabase project is created and credentials are configured
2. Database tables will be created via the SQL schema
3. The application will be ready when you see "Local: http://localhost:3000/"

## API Endpoints

### Boards
- `GET /api/boards` - Get all boards
- `GET /api/boards/:id` - Get board by ID (with lists and cards)
- `POST /api/boards` - Create new board
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board (cascades to lists and cards)

### Lists
- `GET /api/lists?boardId=:boardId` - Get all lists for a board
- `GET /api/lists/:id` - Get list by ID
- `POST /api/lists` - Create new list
- `PUT /api/lists/:id` - Update list
- `DELETE /api/lists/:id` - Delete list (cascades to cards)

### Cards
- `GET /api/cards?listId=:listId` - Get all cards for a list
- `GET /api/cards/:id` - Get card by ID
- `POST /api/cards` - Create new card
- `PUT /api/cards/:id` - Update card
- `DELETE /api/cards/:id` - Delete card

## Data Models

### Board
```typescript
{
  id: uuid (primary key),
  title: string (required),
  description: text,
  created_at: timestamp,
  updated_at: timestamp
}
```

### List
```typescript
{
  id: uuid (primary key),
  title: string (required),
  position: integer,
  board_id: uuid (foreign key -> boards),
  created_at: timestamp,
  updated_at: timestamp
}
```

### Card
```typescript
{
  id: uuid (primary key),
  title: string (required),
  description: text,
  position: integer,
  list_id: uuid (foreign key -> lists),
  created_at: timestamp,
  updated_at: timestamp
}
```

## Docker Services

### Next.js Application
- **Base**: node:18-alpine
- **Port**: 3000
- **Features**:
  - App Router with server/client components
  - API routes for backend logic
  - Static optimization and SSR
  - Hot reload in development

## Development

### Environment Variables

`.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Architecture Highlights

### Integrated Full-Stack
- **Single Codebase**: Frontend and backend in one Next.js application
- **API Routes**: Serverless functions handle backend logic
- **Server Components**: Reduce client-side JavaScript

### Supabase Integration
- **PostgreSQL Database**: Robust relational database
- **Real-time Subscriptions**: Live updates for collaborative features
- **Row Level Security**: Built-in authorization
- **Auto-generated REST API**: Direct database access with security

### Performance
- **Static Generation**: Pre-render pages at build time
- **Incremental Static Regeneration**: Update static content without rebuilding
- **Edge Functions**: Deploy API routes to edge locations

## Troubleshooting

### Problem: "Supabase connection failed"
**Solution**: Check your environment variables
```powershell
# Verify .env.local exists and contains correct credentials
cat .env.local
```

### Problem: "Database tables not found"
**Solution**: Run the SQL schema in Supabase dashboard
- Navigate to SQL Editor in Supabase
- Execute the schema from `supabase/schema.sql`

### Problem: "Port 3000 already in use"
**Solution**: Stop other services or change port
```powershell
docker-compose down
# Or change port in docker-compose.yml
```

### Problem: "Module not found errors"
**Solution**: Rebuild node modules
```powershell
docker-compose down
docker-compose up --build
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)