const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const pool = require("./db");

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Chat server is running" });
});

const rooms = {};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join_room", async ({ username, room }) => {
    socket.join(room);
    socket.username = username;
    socket.room = room;

    if (!rooms[room]) rooms[room] = [];
    rooms[room].push({ id: socket.id, username });

    io.to(room).emit("room_users", rooms[room]);
    socket.to(room).emit("user_joined", {
      message: `${username} joined the room`,
      timestamp: new Date().toISOString(),
    });

    // Load last 50 messages from database
    try {
      const result = await pool.query(
        "SELECT username, message, created_at FROM chat_messages WHERE room = $1 ORDER BY created_at DESC LIMIT 50",
        [room]
      );
      const history = result.rows.reverse().map((row) => ({
        username: row.username,
        message: row.message,
        timestamp: row.created_at,
        type: "message",
      }));
      socket.emit("message_history", history);
    } catch (err) {
      console.error("Error loading message history:", err.message);
    }

    console.log(`${username} joined room: ${room}`);
  });

  socket.on("send_message", async ({ message, room }) => {
    const messageData = {
      username: socket.username,
      message,
      timestamp: new Date().toISOString(),
      id: socket.id,
    };

    io.to(room).emit("receive_message", messageData);

    // Save to database
    try {
      await pool.query(
        "INSERT INTO chat_messages (username, room, message) VALUES ($1, $2, $3)",
        [socket.username, room, message]
      );
    } catch (err) {
      console.error("Error saving message:", err.message);
    }
  });

  socket.on("disconnect", () => {
    const room = socket.room;
    if (room && rooms[room]) {
      rooms[room] = rooms[room].filter((u) => u.id !== socket.id);
      io.to(room).emit("room_users", rooms[room]);
      socket.to(room).emit("user_left", {
        message: `${socket.username} left the room`,
        timestamp: new Date().toISOString(),
      });
    }
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Chat server running on port ${PORT}`);
});