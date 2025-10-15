# Quick Start Guide - Stack 2 (MERN) PoC

## Docker

### Prerequisites

- **Docker Desktop** installed and running

### Steps
```bash
docker-compose up --build
```

**That's it !**

Open your browser and go to:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- MongoDB: mongodb://localhost:27017

## Test the Application

### Create Your First Board
1. Click **Create Board"**
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
3. Create as many cards as you want!

### Delete Items
- **Delete Card**: Hover over a card, click the ✕ button
- **Delete List**: Click the delete (🗑️) button in the list header
- **Delete Board**: Hover over a board card, click the delete (🗑️) button

## Verify Installation

### Check All Services are Running
```powershell
docker-compose ps
```

You should see:
```
stack2-mern-mongodb    healthy
stack2-mern-backend    healthy
stack2-mern-frontend   running
```

### Test Backend API
```powershell
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-10-15T..."
}
```

## Troubleshooting

### Problem: "Port already in use"
**Solution**: Stop other services using ports 3000, 5000, or 27017
```powershell
docker-compose down
docker-compose up
```

### Problem: "MongoDB connection failed"
**Solution**: Wait 30 seconds for MongoDB to initialize
```powershell
docker-compose logs mongodb
```

### Problem: "Cannot access localhost:3000"
**Solution**: Check if frontend is running
```powershell
docker-compose logs frontend
docker-compose restart frontend
```

### Problem: "API errors in console"
**Solution**: Ensure backend is healthy
```powershell
curl http://localhost:5000/health
docker-compose restart backend
```
