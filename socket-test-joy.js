const { io } = require('socket.io-client');

const token =
  'e8d6c0ff0efb1ad6bce3ddbab4a24aec46abb5c1f59323504718ec36f164b8c7';
const roomId = 'room_17ff5756';

const socket = io('http://localhost:3000/chat', {
  transports: ['websocket'],
  query: { token, roomId },
});

socket.on('connect', () => console.log('joy connected:', socket.id));
socket.on('room:joined', (data) => console.log('room:joined', data));
socket.on('room:user_joined', (data) => console.log('room:user_joined', data));
socket.on('room:user_left', (data) => console.log('room:user_left', data));
socket.on('message:new', (data) => console.log('message:new', data));
socket.on('disconnect', () => console.log('joy disconnected'));

// setTimeout(() => {
//   socket.emit('room:leave');
// }, 10000);
