const { io } = require('socket.io-client');

const token =
  '000dad5aab290443ff3aee8f9674c0d23f105e63a4910b118f1bf1c227ed711e';
const roomId = 'room_17ff5756';

const socket = io('http://localhost:3000/chat', {
  transports: ['websocket'],
  query: {
    token,
    roomId,
  },
});

socket.on('connect', () => {
  console.log('connected:', socket.id);
});

socket.on('room:joined', (data) => {
  console.log('room:joined', data);
});

socket.on('message:new', (data) => {
  console.log('message:new', data);
});

socket.on('error', (data) => {
  console.log('error', data);
});

socket.on('disconnect', () => {
  console.log('disconnected');
});
