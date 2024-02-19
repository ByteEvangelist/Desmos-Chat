// dotenvx is just dontenv but lets us use .env.production, .env.development, etc.
import dotenvx from '@dotenvx/dotenvx';
dotenvx.config();

// start web server
import express from 'express';
import http from 'http';
const app = express();
import cors from 'cors';
app.use(cors({ origin: '*' }));
const server = http.createServer(app);

// start socket server
import { Server } from 'socket.io';
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// connect to database
import mongoose from 'mongoose';
const url = process.env.DATABASE_URL;
mongoose
  .connect(url, { dbName: 'DesmosChat' })
  .then(() => console.log('connected'))
  .catch((err) => console.log(err));

import Message from './Models/message.js';
import Room from './Models/room.js';

// used for password hashing, and password decryption
import {
  createHash,
  randomBytes,
  generateKeyPairSync,
  privateDecrypt,
  constants,
} from 'crypto';

// generate a public and private key pair for transmitting the room password
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});
console.log(publicKey);

const hashPassword = async (password) => {
  // generate a random salt
  const salt = randomBytes(16).toString('hex');
  // create a hash of the salt and password
  const hash = createHash('sha256')
    .update(salt + password)
    .digest('hex');
  // return the salt and hash
  return { salt, hash };
};

const newRoom = async (roomName, hasPassword, roomPassword) => {
  // check database for room with the given name
  Room.find({ name: roomName }).then((rooms) => {
    // if no rooms were found, create a new room
    if (rooms.length == 0) {
      // hash the password
      if (hasPassword) {
        hashPassword(roomPassword).then((hash) => {
          // save the room to the database
          new Room({
            name: roomName,
            password: hash,
            hasPassword: true,
          }).save();
        });
      } else {
        new Room({ name: roomName }).save();
      }
    } else {
      console.log('room already exists');
    }
  });
};
newRoom('second room', false, '');
newRoom('main room', true, 'ilikemath');

io.on('connection', (socket) => {
  socket.on('roomName', (roomName) => {
    // find the room with the given name in the database
    Room.find({ name: roomName }).then((room) => {
      // check if any rooms were found (should only be one room with the given name)
      if (room.length == 0) {
        // room not found
        socket.emit('event', 'room not found');
      } else {
        // room found
        room = room[0];
        // check if the room has a password
        switch (room.hasPassword) {
          // no password
          case false:
            socket.join(room.id);
            socket.emit('event', 'joined room');
            console.log('joined room');
            Message.find({ roomId: room.id })
              .select('-_id -roomId')
              .sort({ create_at: 1 })
              .then((messages) => {
                socket.emit('message history', messages);
              });
            break;
          // password required
          case true:
            socket.emit('event', 'password required');
            socket.emit('public key', publicKey);
            break;
        }
      }
    });
  });
  socket.on('password', (roomName, password) => {
    // decrypt the password
    let buff = Buffer.from(password, 'base64');
    const decryptedPassword = privateDecrypt(
      { key: privateKey, padding: constants.RSA_PKCS1_PADDING },
      buff
    );

    // find the room with the given name in the database
    Room.find({ name: roomName }).then((room) => {
      // verify that room exists
      if (room.length == 0) {
        socket.emit('event', 'room not found');
      } else {
        room = room[0];
        // hash the decrypted password
        const hash = createHash('sha256')
          .update(room.password.salt + decryptedPassword)
          .digest('hex');
        // compare the hash to the stored hash
        if (hash == room.password.hash) {
          // password correct
          socket.join(room.id);
          socket.emit('event', 'joined room');
          Message.find({ roomId: room.id })
            .select('-_id -roomId')
            .sort({ create_at: 1 })
            .then((messages) => {
              socket.emit('message history', messages);
            });
        } else {
          // password incorrect
          socket.emit('event', 'password incorrect');
        }
      }
    });
  });
  socket.on('message', (roomName, username, text) => {
    Room.find({ name: roomName }).then((room) => {
      room = room[0];
      if (socket.rooms.has(room.id)) {
        new Message({
          roomId: room.id,
          text: text,
          username: username,
        })
          .save()
          .then(() => {
            io.to(room.id).emit('message', username, text);
          });
      }
    });
  });
});

// let users = {};

// io.on('connection', (socket) => {
//   socket.on('chat message', async (msg) => {
//     if (socket.rooms.has('main room') && users[socket.id]) {
//       console.log(users[socket.id].username);
//       let chatMessage = {
//         username: users[socket.id].username,
//         message: msg,
//       };
//       await db.collection('messages').insertOne(chatMessage);
//       io.to('main room').emit('chat message', chatMessage);
//       console.log({
//         chatMessage: chatMessage,
//         ipAddress: socket.handshake,
//       });
//     }
//   });
//   socket.on('username', (username) => {
//     if (socket.rooms.has('main room') && username) {
//       let user = {
//         id: socket.id,
//         username: username,
//       };
//       users[user.id] = user;
//     }
//   });
//   socket.on('password', async (password) => {
//     if (password == 'ilikemath') {
//       socket.emit('system message', 'access granted');
//       socket.join('main room');
//       socket.emit(
//         'messages',
//         await collection
//           .find({}, { projection: { _id: 0, username: 1, message: 1 } })
//           .sort({ create_at: -1 })
//           .toArray()
//       );
//     }
//   });
// });

app.get('/', (req, res) => {
  res.send('Api');
});

server.listen(process.env.PORT, () => {
  console.log('listening on *:' + process.env.PORT);
});
