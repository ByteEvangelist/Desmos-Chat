var socket = io('http://localhost:3001/', {
  transports: ['polling'],
});

socket.emit('roomName', 'main room');

socket.on('event', (event) => {
  switch (event) {
    case 'room not found':
      console.log('Room not found');
      break;
    case 'joined room':
      console.log('Joined room');
      socket.emit('message', 'main room', 'Hello', 'yo');
      break;
    case 'password required':
      console.log('Password required');
      socket.on('public key', (publicKey) => {
        console.log(publicKey);
        encryptedPassword = encrypt('ilikemath', publicKey);
        console.log(encryptedPassword);
        socket.emit('password', 'main room', encryptedPassword);
      });
      break;
  }
});

socket.on('message', (username, text) => {
  console.log(username, text);
});

socket.on('message history', (messages) => {
  for (let message of messages) {
    console.log(message.username, message.text);
  }
});

function encrypt(data, publicKey) {
  var encrypt = new JSEncrypt();
  encrypt.setPublicKey(publicKey);
  var encrypted = encrypt.encrypt(data);

  return encrypted;
}
