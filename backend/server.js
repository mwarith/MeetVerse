import process from 'node:process';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
  origin: "*", // In production, replace with your frontend URL
  methods: ["GET", "POST"]
}));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, replace with your frontend URL
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Serve static files from the frontend build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));

  // Handle SPA routing - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// simple in-memory store for mapping socketId -> roomId (optional, for cleanup)
const socketToRoom = {};

io.on('connection', (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on('join-room', (roomId, userId) => {
    console.log(`User ${userId} joined room ${roomId}`);
    socket.join(roomId);
    socketToRoom[socket.id] = roomId;

    // Broadcast to others in the room that a new user connected
    socket.to(roomId).emit('user-connected', userId);

    socket.on('disconnect', () => {
      console.log(`User Disconnected: ${socket.id}`);
      socket.to(roomId).emit('user-disconnected', userId);
      delete socketToRoom[socket.id];
    });
  });

  // Relay WebRTC signals
  socket.on('offer', (payload) => {
    // payload: { target: targetUserId, caller: myUserId, sdp: ... }
    io.to(payload.target).emit('offer', payload);
  });

  socket.on('answer', (payload) => {
    // payload: { target: callerUserId, caller: myUserId, sdp: ... }
    io.to(payload.target).emit('answer', payload);
  });

  socket.on('ice-candidate', (incoming) => {
    // incoming: { target, candidate }
    io.to(incoming.target).emit('ice-candidate', {
      ...incoming,
      sender: socket.id,
    });
  });

  // Chat message relay
  socket.on('chat-message', ({ roomId, message }) => {
    // Broadcast to others in the room (not back to sender)
    socket.to(roomId).emit('chat-message', message);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
