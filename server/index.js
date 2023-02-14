import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:3000" } });

let currGlobalRoom = null;
let openGlobalRoom = new Set();
let friendlyRooms = new Map();

app.use(cors({ origin: "http://localhost:3000" }));

const getRoom = (it) => {
  it.next();
  return it.next().value;
};
const joinRoom = (socket, room) => {
  socket.join(room);
  socket.emit("global-added", {
    id: room,
    players: Array.from(io.sockets.adapter.rooms.get(room)),
  });
  socket.to(room).emit("global-padded", socket.id);
};

io.on("connection", (socket) => {
  socket.emit("socketId", socket.id);
  socket.on("add-global", () => {
    if (
      io.sockets.adapter.rooms.get(currGlobalRoom)?.size < 4 &&
      60000 - (new Date().getTime() - currGlobalRoom) > 10000
    ) {
      joinRoom(socket, currGlobalRoom);
    } else {
      openGlobalRoom.forEach(
        (val) =>
          60000 - (new Date().getTime() - val) < 11000 &&
          openGlobalRoom.delete(val)
      );
      const bool = openGlobalRoom.entries().next().value;
      if (bool) {
        currGlobalRoom = bool[0];
        openGlobalRoom.delete(bool[0]);
        joinRoom(socket, currGlobalRoom);
      } else {
        currGlobalRoom = new Date().getTime();
        joinRoom(socket, currGlobalRoom);
      }
    }
  });
  socket.on("create-friendly", () => {
    const url = `${socket.id}-${new Date().getTime()}`;
    socket.join(url);
    socket.emit("friendly-created", url);
  });
  socket.on("join-friendly", (url) => {
    if (
      io.sockets.adapter.rooms.get(url)?.size < 4 &&
      !friendlyRooms.get(url)
    ) {
      socket.join(url);
      joinRoom(socket, url);
    } else {
      socket.emit("room-capacity-full");
    }
  });
  socket.on("friendly-start-countdown", (room) => {
    socket.emit("friendly-start-countdown");
    socket.to(room).emit("friendly-start-countdown");
    friendlyRooms.set(room, 1);
  });
  socket.on("set-progress", (obj) => {
    socket
      .to(obj.roomId)
      .emit("set-progress", { progress: obj.progress, player: socket.id });
  });
  socket.on("finished", (obj) => {
    socket.to(obj.roomId).emit("finished", { id: socket.id, time: obj.time });
  });
  socket.on("leave-friendly", () => {
    const room = getRoom(socket.rooms.values());
    socket.to(room).emit("global-premoved", socket.id);
    if (
      friendlyRooms.get(room) &&
      io.sockets.adapter.rooms.get(room)?.size === 1
    ) {
      friendlyRooms.delete(room);
    }
    socket.leave(room);
  });
  socket.on("leave-global", () => {
    const room = getRoom(socket.rooms.values());
    socket.to(room).emit("global-premoved", socket.id);
    const bool = openGlobalRoom.has(room);
    if (bool && io.sockets.adapter.rooms.get(room)?.size === 1) {
      openGlobalRoom.delete(room);
    } else if (room !== currGlobalRoom && !bool) {
      openGlobalRoom.add(room);
    }
    socket.leave(room);
  });
  socket.on("disconnecting", () => {
    const room = getRoom(socket.rooms.values());
    socket.to(room).emit("global-premoved", socket.id);
    if (typeof room === "string") {
      if (
        friendlyRooms.get(room) &&
        io.sockets.adapter.rooms.get(room)?.size === 1
      ) {
        friendlyRooms.delete(room);
      }
    } else {
      const bool = openGlobalRoom.has(room);
      if (bool && io.sockets.adapter.rooms.get(room)?.size === 1) {
        openGlobalRoom.delete(room);
      } else if (room !== currGlobalRoom && !bool) {
        openGlobalRoom.add(room);
      }
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`Server Running on Port: http://localhost:${PORT}`)
);
