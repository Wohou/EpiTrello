# Quick Start Guide - Stack 3 PoC

## Docker

### Prerequisites
- Docker Desktop installed

### Steps
```bash
docker-compose up --build
```

**That's it !**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Django Admin: http://localhost:8000/admin


## Test the Application

1. **Create a Board:**
   - Go to http://localhost:3000
   - Click "Create Board"
   - Enter title and description

2. **Add Lists:**
   - Open your board
   - Click "Add a list"
   - Enter list title

3. **Add Cards:**
   - Inside a list, click "Add a card"
   - Enter card details

4. **Manage Everything:**
   - Delete boards, lists, or cards using the delete buttons
   - Watch real-time updates!

---

## API Documentation

Visit http://localhost:8000/api/ for the interactive API browser

### Key Endpoints:
- `GET/POST /api/boards/` - Boards
- `GET/POST /api/lists/` - Lists
- `GET/POST /api/cards/` - Cards

---

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Run migrations: `python manage.py migrate`

### Frontend can't connect to backend
- Verify backend is running on port 8000
- Check CORS settings in Django
- Clear browser cache

### Docker issues
- Ensure Docker Desktop is running
- Try: `docker-compose down -v` then `docker-compose up --build`

