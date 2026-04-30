const { io } = require('socket.io-client');

const token =
  'af6229861b56d7f246bda65b57bad6d4f550d32fd37789e92736659923d582fb';
const roomId = 'room_e1164da7';

const socket = io('http://localhost:3000/chat', {
  transports: ['websocket'],
  query: { token, roomId },
});

socket.on('connect', () => console.log('ali connected:', socket.id));
socket.on('room:joined', (data) => console.log('room:joined', data));
socket.on('room:user_joined', (data) => console.log('room:user_joined', data));
socket.on('room:user_left', (data) => console.log('room:user_left', data));
socket.on('message:new', (data) => console.log('message:new', data));
socket.on('room:deleted', (data) => console.log('room:deleted', data));
socket.on('disconnect', () => console.log('ali disconnected'));
