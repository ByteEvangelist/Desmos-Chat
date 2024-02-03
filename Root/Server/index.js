import express from 'express';
const app = express();
import http from 'http';
const server = http.createServer(app);
import { Server } from 'socket.io';
const io = new Server(server);

let users = {};

io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    if (socket.rooms.has('main room')) {
      console.log(users[socket.id].username);
      let chatMessage = {
        username: users[socket.id].username,
        message: msg,
      };
      io.to('main room').emit('chat message', chatMessage);
    }
  });
  socket.on('username', (username) => {
    if (socket.rooms.has('main room')) {
      let user = {
        id: socket.id,
        username: username,
      };
      users[user.id] = user;
    }
  });
  socket.on('password', (password) => {
    if (password == 'i am smart') {
      socket.emit('system message', 'access granted');
      socket.join('main room');
    }
  });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
