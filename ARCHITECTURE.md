# Architecture

## Overview

This is a real-time anonymous chat system.

Users login using only username. A session token is generated and stored in Redis.

Messages are stored in PostgreSQL. Real-time updates are handled using WebSocket (Socket.io) and Redis pub/sub.

---

## System Flow

Client → REST API → Service Layer → DB / Redis
Client ↔ WebSocket Gateway ↔ Redis Pub/Sub

---

## Components

### 1. REST API

Base path:
/api/v1

Handles:

- login
- rooms
- messages

Response format:

Success:
{
"success": true,
"data": {}
}

Error:
{
"success": false,
"error": {
"code": "ERROR_CODE",
"message": "message"
}
}

---

### 2. PostgreSQL

Stores:

- users
- rooms
- messages

Used for permanent data.

---

### 3. Redis

Used for:

- sessions
- active users
- socket state
- pub/sub events

---

### 4. WebSocket (Socket.io)

Namespace:
/chat

Used for:

- real-time messaging
- presence tracking

---

## Session Strategy

On login:

- generate random token
- store in Redis:

session:<token>

Value:
{
"userId": "...",
"username": "..."
}

TTL = 24 hours

---

## Pub/Sub Flow

When message is created:

1. Save in DB
2. Publish event:

channel: chat:events

Example:

{
"event": "message:new",
"roomId": "room_xxx",
"payload": {...}
}

3. WebSocket gateway receives
4. Broadcast to clients

---

## Active Users

Stored in Redis Set:

room:<roomId>:active_users

On join:

- add username
- emit room:user_joined

On leave:

- remove username
- emit room:user_left

---

## Room Delete Flow

1. Check creator permission
2. Publish:

event: room:deleted

3. Broadcast via WebSocket
4. Soft delete in DB

---

## Capacity (Single Instance)

~2000–5000 concurrent connections (light load)

Depends on:

- memory
- Redis speed
- DB performance

---

## Scaling Plan (10x)

- multiple app instances
- load balancer
- Redis pub/sub shared
- DB read replica
- caching
- rate limiting
- monitoring

---

## Limitations

- no password auth
- Redis pub/sub is not persistent
- no rate limiting
- no tests
- same username multiple tab limitation
