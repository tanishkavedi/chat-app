# ChatSpace — Real-Time Chat Application

A real-time, multi-room chat application built with Socket.IO. Join different rooms, see who's online, and chat instantly with persistent message history.

## Features
- 💬 Real-time messaging using Socket.IO
- 🏠 Multiple chat rooms
- 🟢 Live online users list per room
- 💾 Message persistence with PostgreSQL — chat history loads on join
- 🔄 Session persistence — stays in room across page refresh
- ⚡ Instant message delivery with no page reload


## Tech Stack
**Frontend**
- React 18, Vite, Tailwind CSS
- Socket.IO Client

**Backend**
- Node.js, Express.js
- Socket.IO
- PostgreSQL (Supabase)

**Deployment**
- Frontend: Vercel
- Backend: Render

## Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL database (Supabase)

### Installation

**Clone the repo**
```bash
git clone https://github.com/tanishkavedi/chat-app.git
cd chat-app
```

**Setup backend**
```bash
cd server
npm install
```

Create `.env` file in server folder:
DATABASE_URL=your_postgresql_connection_string 

PORT=5001

Run this SQL in your PostgreSQL database:
```sql
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  room VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_room ON chat_messages(room);
```

```bash
node index.js
```

**Setup frontend**
```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`
