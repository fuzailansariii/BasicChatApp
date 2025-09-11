import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import {
  ChatMessage,
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
  User,
} from "@repo/types/index";

const app = express();
const httpserver = createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpserver, {
  cors: {
    origin: process.env.WEB_URI ?? "http://localhost:3000",
    credentials: true,
  },
});

const connectedUsers = new Map<string, User>();
console.log("SocketIO server starting...");

io.on("connection", (socket) => {
  console.log("New Client Connected: ", socket.id);

  // when user join a room
  socket.on("join_room", ({ username, room = "general" }) => {
    console.log(`${username} joined room: ${room}`);
    socket.data.username = username;
    socket.data.room = room;

    const user: User = {
      id: socket.id,
      username,
      isOnline: true,
    };
    // add to local storage
    connectedUsers.set(socket.id, user);
    socket.join(room);

    // notify others about the new user
    socket.to(room).emit("user_joined", user);

    // send current online users to new User
    const onlineUsers = Array.from(connectedUsers.values());
    socket.emit("users_online", onlineUsers);
  });

  // handle chat message
  socket.on("chat_message", ({ message, username }) => {
    // console.log("RAW incoming message:", data);

    console.log(`username: ${username} - message: ${message}`);

    const chatMessage: ChatMessage = {
      id: `${socket.id} - ${Date.now()}`,
      username,
      message,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour12: true,
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const room = socket.data.room || "general";
    io.to(room).emit("chat_message", chatMessage);
  });

  // disconnect
  socket.on("disconnect", () => {
    // console.log("Client Disconnected", socket.id);
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`${user.username} disconnected`);
      connectedUsers.delete(socket.id);
      const room = socket.data.room || "general";
      socket.to(room).emit("user_left", user);
    }
    console.log("User disconnected", socket.id);
  });
});

const PORT = process.env.PORT ?? 4000;

httpserver.listen(PORT, () => {
  console.log(`SocketIO server is running on port: ${PORT}`);
});
