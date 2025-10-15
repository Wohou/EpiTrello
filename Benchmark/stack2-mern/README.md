# EpiTrello - Stack 2 (MERN) - README

This is a **Proof of Concept (PoC)** implementation of a Trello-like application using the **MERN Stack** (MongoDB, Express.js, React, Node.js). This project demonstrates a traditional full-stack JavaScript architecture with complete separation between frontend and backend.

**See [Benchmark](../../Benchmark.md)** for more information on the other stack.<br>
**See [QUICKSTART](./QUICKSTART.md)** for an overview to test the program and the stack.

## TechStack

- **Frontend** : React, 18.2.0 | User interface library
- **Backend** : Express.js, 4.18.2 | Web application framework
- **Database** : MongoDB, 7 | NoSQL document database
- **Styling**: Custom CSS

## Quick Start

### Prerequisites
- Docker Desktop installed and running
- Git (for cloning the repository)

### Installation

1. **Navigate to the stack2-mern directory**
```powershell
cd Benchmark/stack2-mern
```

2. **Start all services with Docker Compose**
```powershell
docker-compose up --build
```

3. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

### First Time Setup
The first time you run the application:
1. Wait for all containers to be healthy (check Docker logs)
2. MongoDB will automatically initialize
3. The application will be ready when you see " MongoDB connected successfully"

## API Endpoints

### Boards
- `GET /api/boards` - Get all boards
- `GET /api/boards/:id` - Get board by ID (with lists and cards)
- `POST /api/boards` - Create new board
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board (cascades to lists and cards)

### Lists
- `GET /api/boards/:boardId/lists` - Get all lists for a board
- `GET /api/boards/:boardId/lists/:id` - Get list by ID
- `POST /api/boards/:boardId/lists` - Create new list
- `PUT /api/boards/:boardId/lists/:id` - Update list
- `DELETE /api/boards/:boardId/lists/:id` - Delete list (cascades to cards)

### Cards
- `GET /api/lists/:listId/cards` - Get all cards for a list
- `GET /api/lists/:listId/cards/:id` - Get card by ID
- `POST /api/lists/:listId/cards` - Create new card
- `PUT /api/lists/:listId/cards/:id` - Update card
- `DELETE /api/lists/:listId/cards/:id` - Delete card

## Data Models

### Board
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  createdAt: Date,
  updatedAt: Date,
  lists_count: Number (virtual)
}
```

### List
```javascript
{
  _id: ObjectId,
  title: String (required),
  position: Number,
  board: ObjectId (ref: Board),
  createdAt: Date,
  updatedAt: Date,
  cards_count: Number (virtual)
}
```

### Card
```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  position: Number,
  list: ObjectId (ref: List),
  createdAt: Date,
  updatedAt: Date
}
```

## Docker Services

### MongoDB (Database)
- **Image**: mongo:7-jammy
- **Port**: 27017
- **Health Check**: mongosh ping command
- **Volume**: Persistent data storage

### Backend (Express API)
- **Base**: node:18-alpine
- **Port**: 5000
- **Health Check**: HTTP GET /health
- **Features**: Auto-reconnect to MongoDB, CORS enabled

### Frontend (React + Vite)
- **Base**: node:18-alpine
- **Port**: 3000
- **Features**: Hot reload, proxy to backend API

## Development

### Backend Development
```powershell
cd backend
npm install
npm run dev
```

### Frontend Development
```powershell
cd frontend
npm install
npm run dev
```

### Environment Variables

Backend (`.env`):
```env
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/trello
NODE_ENV=development
```

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://www.mongodb.com/docs/)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

