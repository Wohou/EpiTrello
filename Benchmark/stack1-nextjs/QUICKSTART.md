# Quick Start Guide - Stack 1 (Next.js + Supabase) PoC


## Docker

### Prerequisites

- **Docker Desktop** installed and running

### Steps

1. **Create environment file**
```bash
# In the stack1-nextjs directory, create .env.local
echo NEXT_PUBLIC_SUPABASE_URL=your_project_url > .env.local
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key >> .env.local
```

2. **Start the application**
```bash
docker-compose up --build
```

**That's it !**

Open your browser and go to:

- Application: http://localhost:3000

## Test the Application

### Create Your First Board
1. Click **"Create Board"**
2. Enter a title (e.g., "My Project")
3. Add a description (optional)
4. Click **"Create Board"**

### Add Lists to Your Board
1. Click on your board card to open it
2. Click **"Add List"**
3. Enter a list name (e.g., "To Do")
4. Create more lists: "In Progress", "Done"

### Add Cards to Lists
1. In a list, click **"Add Card"**
2. Enter card title and description
3. Create as many cards as you want

### Delete Items
- **Delete Card**: Hover over a card, click the delete button
- **Delete List**: Click the delete button in the list header
- **Delete Board**: Hover over a board card, click the delete button

## Verify Installation

### Check Application is Running
```powershell
docker-compose ps
```

You should see:
```
stack1-nextjs-app   running   0.0.0.0:3000->3000/tcp
```

### Test API Routes
```powershell
curl http://localhost:3000/api/boards
```

Expected response:
```json
[]
```

### Check Supabase Connection
Open the browser console (F12) when accessing http://localhost:3000
You should NOT see any Supabase connection errors.

## Troubleshooting

### Problem: "Supabase client error"
**Solution**: Check your environment variables
```powershell
# Ensure .env.local exists with correct credentials
cat .env.local
```

### Problem: "relation 'boards' does not exist"
**Solution**: Run the SQL schema in Supabase dashboard
- Copy the SQL from above
- Paste in SQL Editor
- Click "Run"

### Problem: "Port already in use"
**Solution**: Stop other services using port 3000
```powershell
docker-compose down
docker-compose up
```

### Problem: "Cannot access localhost:3000"
**Solution**: Check if container is running
```powershell
docker-compose logs app
docker-compose restart app
```

### Problem: "Module not found"
**Solution**: Rebuild the container
```powershell
docker-compose down
docker-compose up --build
```
