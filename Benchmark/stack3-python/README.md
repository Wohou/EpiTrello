# Stack 3 - Vue.js + Django + PostgreSQL PoC

This is a Proof of Concept for the EpiTrello project using Stack 3: Vue.js frontend, Django backend, and PostgreSQL database.

**See [Benchmark](../../Benchmark.md)** for more information on the other stack.<br>
**See [QUICKSTART](./QUICKSTART.md)** for an overview to test the program and the stack.

## Tech Stack

- **Frontend**: Vue.js 3 with Vite, Vue Router, Pinia (state management)
- **Backend**: Django 4.2 with Django REST Framework
- **Database**: PostgreSQL
- **Styling**: Custom CSS

## Features Implemented

- Create, view, and delete boards
- Create and delete lists within boards
- Create and delete cards within lists
- Real-time UI updates
- RESTful API architecture
- Responsive design

## Setup Instructions

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL 13+

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   - Windows:
     ```bash
     venv\Scripts\activate
     ```
   - Mac/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables:**
   - Copy `.env.example` to `.env`
   - Update the database credentials in `.env`

6. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE trello_db;
   ```

7. **Run migrations:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

8. **Create a superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

9. **Start the development server:**
   ```bash
   python manage.py runserver
   ```

The backend API will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## API Endpoints

### Boards
- `GET /api/boards/` - List all boards
- `POST /api/boards/` - Create a new board
- `GET /api/boards/{id}/` - Get board details
- `PUT /api/boards/{id}/` - Update a board
- `DELETE /api/boards/{id}/` - Delete a board

### Lists
- `GET /api/lists/` - List all lists (filter by `?board=<id>`)
- `POST /api/lists/` - Create a new list
- `GET /api/lists/{id}/` - Get list details
- `PUT /api/lists/{id}/` - Update a list
- `DELETE /api/lists/{id}/` - Delete a list
- `PATCH /api/lists/{id}/update_position/` - Update list position

### Cards
- `GET /api/cards/` - List all cards (filter by `?list=<id>`)
- `POST /api/cards/` - Create a new card
- `GET /api/cards/{id}/` - Get card details
- `PUT /api/cards/{id}/` - Update a card
- `DELETE /api/cards/{id}/` - Delete a card
- `PATCH /api/cards/{id}/move/` - Move card to different list/position

## Key Advantages of this stack

1. **Versatility**: Combining JavaScript frontend with Python backend shows full-stack capabilities
2. **Django's "Batteries Included"**: Built-in admin panel, ORM, and authentication
3. **Vue.js Simplicity**: Easy to learn with great documentation
4. **PostgreSQL Reliability**: Industry-standard relational database
5. **Professional Architecture**: Clear separation of concerns


## Testing

### Backend
```bash
cd backend
python manage.py test
```

### Frontend
```bash
cd frontend
npm run test
```

## Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Vue.js Documentation](https://vuejs.org/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
