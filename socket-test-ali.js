const { io } = require('socket.io-client');

const token =
  '9ce0a7c2b58e8acd79222d9499ae10c34c237ac37704ef519f8d1a582bc4a397';
const roomId = 'room_17ff5756';

const socket = io('http://localhost:3000/chat', {
  transports: ['websocket'],
  query: { token, roomId },
});

socket.on('connect', () => console.log('ali connected:', socket.id));
socket.on('room:joined', (data) => console.log('room:joined', data));
socket.on('room:user_joined', (data) => console.log('room:user_joined', data));
socket.on('room:user_left', (data) => console.log('room:user_left', data));
socket.on('message:new', (data) => console.log('message:new', data));
socket.on('disconnect', () => console.log('ali disconnected'));
