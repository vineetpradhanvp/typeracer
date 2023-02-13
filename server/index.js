import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:3000" } });

let currGlobalRoom = null;
let openGlobalRoom = [];

app.use(cors({ origin: "http://localhost:3000" }));

const getRoom = (it) => {
  it.next();
  return it.next().value;
};
const joinRoom = (socket) => {
  socket.join(currGlobalRoom);
  socket.emit("global-added", {
    id: currGlobalRoom,
    players: Array.from(io.sockets.adapter.rooms.get(currGlobalRoom)),
  });
  socket.to(currGlobalRoom).emit("global-padded", socket.id);
};
io.on("connection", (socket) => {
  socket.emit("socketId", socket.id);
  socket.on("add-global", () => {
    if (
      io.sockets.adapter.rooms.get(currGlobalRoom)?.size < 4 &&
      60000 - (new Date().getTime() - currGlobalRoom) > 10000
    ) {
      joinRoom(socket);
    } else {
      openGlobalRoom = openGlobalRoom.filter(
        (r) => 60000 - (new Date().getTime() - r) > 11000
      );
      if (openGlobalRoom.length) {
        currGlobalRoom = openGlobalRoom[openGlobalRoom.length - 1];
        openGlobalRoom.pop();
        joinRoom(socket);
      } else {
        currGlobalRoom = new Date().getTime();
        joinRoom(socket);
      }
    }
  });
  socket.on("set-progress", (obj) => {
    socket
      .to(obj.roomId)
      .emit("set-progress", { progress: obj.progress, player: socket.id });
  });
  socket.on("finished", (obj) => {
    socket.to(obj.roomId).emit("finished", { id: socket.id, time: obj.time });
  });
  socket.on("disconnecting", () => {
    const room = getRoom(socket.rooms.values());
    socket.to(room).emit("global-premoved", socket.id);
    if (room !== currGlobalRoom && !openGlobalRoom.find((r) => r === room)) {
      openGlobalRoom.push(room);
    }
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`Server Running on Port: http://localhost:${PORT}`)
);
