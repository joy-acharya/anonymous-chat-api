# Anonymous Chat API

Real-time anonymous group chat API built with NestJS, PostgreSQL, Drizzle ORM, Redis, Socket.io, and TypeScript.

## Tech Stack

- NestJS
- PostgreSQL
- Drizzle ORM
- Redis
- Socket.io
- TypeScript
- Docker Compose

## Features

- Username-only login
- Redis-based session token
- Room create/list/details/delete
- Creator-only room delete
- Paginated message history
- Message persistence in PostgreSQL
- Redis pub/sub message broadcasting
- Socket.io real-time chat gateway
- Redis active user tracking
- Room join/leave/delete events

## Local Setup

### 1. Install dependencies

npm install

### 2. Copy environment file

Windows:
copy .env.example .env

### 3. Start services

docker compose up -d

### 4. Push DB schema

npm run db:push

### 5. Start server

npm run start:dev

Server:
http://localhost:3000
Base path:
http://localhost:3000/api/v1

## Environment Variables

PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/anonymous_chat
APP_REDIS_URL=redis://localhost:6380
SESSION_TTL_SECONDS=86400

## API Examples

### Login

POST /api/v1/login

{
"username": "ali_123"
}

### Create Room

POST /api/v1/rooms
Authorization: Bearer <token>

{
"name": "general-room"
}

### Send Message

POST /api/v1/rooms/:id/messages

{
"content": "hello everyone"
}

### Delete Room

DELETE /api/v1/rooms/:id

## WebSocket

Namespace:
/chat

Connection:
ws://localhost:3000/chat?token=<token>&roomId=<roomId>

Events:

Server → Client:

- room:joined
- room:user_joined
- message:new
- room:user_left
- room:deleted

Client → Server:

- room:leave

## Scripts

npm run start:dev
npm run build
npm run db:push
