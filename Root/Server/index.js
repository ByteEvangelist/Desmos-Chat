import express from 'express';
const app = express();
import http from 'http';
const server = http.createServer(app);
import { Server } from 'socket.io';
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});
import { MongoClient } from 'mongodb';
// or as an es module:
// import { MongoClient } from 'mongodb'

// Connection URL
const url = 'mongodb://mongoadmin:test@localhost:27017/';
const client = new MongoClient(url);

// Database Name
const dbName = 'desmosChat';
let db;
let collection;
async function main() {
  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to server');
  db = client.db(dbName);
  collection = db.collection('messages');

  const findResult = await collection.find().toArray();
  console.log('messages =>', findResult);
  return 'done.';
}

main().then(console.log).catch(console.error);

let users = {};

io.on('connection', (socket) => {
  socket.on('chat message', async (msg) => {
    if (socket.rooms.has('main room')) {
      console.log(users[socket.id].username);
      let chatMessage = {
        username: users[socket.id].username,
        message: msg,
      };
      await db.collection('messages').insertOne(chatMessage);
      io.to('main room').emit('chat message', chatMessage);
      console.log(await collection.find().sort({ create_at: -1 }).toArray());
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
      console.log(await collection.find().sort({ create_at: -1 }).toArray());
    }
  });
});

app.get('/', (req, res) => {
  res.send('Api');
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});
