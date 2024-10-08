import express from 'express';
import http from 'http';
const app = express();
const server = http.createServer(app);
import dotenvx from '@dotenvx/dotenvx';
dotenvx.config();

import { Server } from 'socket.io';
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});
import mongoose from 'mongoose';

const url = process.env.DATABASE_URL;
mongoose
  .connect(url)
  .then(() => console.log('connected'))
  .catch((err) => console.log(err));

// const dbName = 'desmosChat';
// let db;
// let collection;
// async function main() {
//   // Use connect method to connect to the server
//   await client.connect();
//   console.log('Connected successfully to server');
//   db = client.db(dbName);
//   collection = db.collection('messages');

//   return 'done.';
// }

// main().then(console.log).catch(console.error);

let users = {};

io.on('connection', (socket) => {
  socket.on('chat message', async (msg) => {
    if (socket.rooms.has('main room') && users[socket.id]) {
      console.log(users[socket.id].username);
      let chatMessage = {
        username: users[socket.id].username,
        message: msg,
      };
      await db.collection('messages').insertOne(chatMessage);
      io.to('main room').emit('chat message', chatMessage);
      console.log({
        chatMessage: chatMessage,
        ipAddress: socket.handshake,
      });
    }
  });
  socket.on('username', (username) => {
    if (socket.rooms.has('main room') && username) {
      let user = {
        id: socket.id,
        username: username,
      };
      users[user.id] = user;
    }
  });
  socket.on('password', async (password) => {
    if (password == 'ilikemath') {
      socket.emit('system message', 'access granted');
      socket.join('main room');
      socket.emit(
        'messages',
        await collection
          .find({}, { projection: { _id: 0, username: 1, message: 1 } })
          .sort({ create_at: -1 })
          .toArray()
      );
    }
  });
});

app.get('/', (req, res) => {
  res.send('Api');
});

server.listen(process.env.PORT, () => {
  console.log('listening on *:3000');
});
