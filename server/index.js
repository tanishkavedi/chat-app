const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");


dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
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

  
  socket.on("join_room", ({ username, room }) => {
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

    console.log(`${username} joined room: ${room}`);
  });

 
  socket.on("send_message", ({ message, room }) => {
    io.to(room).emit("receive_message", {
      username: socket.username,
      message,
      timestamp: new Date().toISOString(),
      id: socket.id,
    });
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