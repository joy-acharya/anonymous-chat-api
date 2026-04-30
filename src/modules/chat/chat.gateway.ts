import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/db';
import { rooms } from '../../db/schema';
import { RedisService } from '../../redis/redis.service';

type RedisChatEvent = {
  event: 'message:new';
  roomId: string;
  payload: {
    id: string;
    username: string;
    content: string;
    createdAt: string;
  };
};

@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly subscriber;

  constructor(private readonly redisService: RedisService) {
    this.subscriber = this.redisService.getClient().duplicate();

    this.subscriber.subscribe('chat:events');

    this.subscriber.on('message', (_channel, message) => {
      const event = JSON.parse(message) as RedisChatEvent;

      if (event.event === 'message:new') {
        this.server.to(event.roomId).emit('message:new', event.payload);
      }
    });
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.query.token as string | undefined;
    const roomId = client.handshake.query.roomId as string | undefined;

    if (!token) {
      client.emit('error', {
        code: 401,
        message: 'Missing or expired session token',
      });
      client.disconnect(true);
      return;
    }

    if (!roomId) {
      client.emit('error', {
        code: 404,
        message: 'Room not found',
      });
      client.disconnect(true);
      return;
    }

    const session = await this.redisService.getClient().get(`session:${token}`);

    if (!session) {
      client.emit('error', {
        code: 401,
        message: 'Missing or expired session token',
      });
      client.disconnect(true);
      return;
    }

    const roomRows = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.isDeleted, false)))
      .limit(1);

    if (!roomRows[0]) {
      client.emit('error', {
        code: 404,
        message: 'Room not found',
      });
      client.disconnect(true);
      return;
    }

    const user = JSON.parse(session) as { userId: string; username: string };

    client.data.user = user;
    client.data.roomId = roomId;

    await client.join(roomId);

    const activeUsersKey = this.getActiveUsersKey(roomId);

    await this.redisService.getClient().sadd(activeUsersKey, user.username);

    await this.redisService
      .getClient()
      .set(
        this.getSocketKey(client.id),
        JSON.stringify({ roomId, username: user.username }),
      );

    const activeUsers = await this.redisService
      .getClient()
      .smembers(activeUsersKey);

    client.emit('room:joined', {
      activeUsers,
    });

    client.to(roomId).emit('room:user_joined', {
      username: user.username,
      activeUsers,
    });
  }

  async handleDisconnect(client: Socket) {
    await this.removeUserFromRoom(client);
  }

  @SubscribeMessage('room:leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() _body: unknown,
  ) {
    await this.removeUserFromRoom(client);
    client.disconnect(true);
  }

  private async removeUserFromRoom(client: Socket) {
    const socketStateRaw = await this.redisService
      .getClient()
      .get(this.getSocketKey(client.id));

    if (!socketStateRaw) {
      return;
    }

    const socketState = JSON.parse(socketStateRaw) as {
      roomId: string;
      username: string;
    };

    const activeUsersKey = this.getActiveUsersKey(socketState.roomId);

    await this.redisService
      .getClient()
      .srem(activeUsersKey, socketState.username);

    await this.redisService.getClient().del(this.getSocketKey(client.id));

    const activeUsers = await this.redisService
      .getClient()
      .smembers(activeUsersKey);

    client.to(socketState.roomId).emit('room:user_left', {
      username: socketState.username,
      activeUsers,
    });
  }

  private getActiveUsersKey(roomId: string) {
    return `room:${roomId}:active_users`;
  }

  private getSocketKey(socketId: string) {
    return `socket:${socketId}`;
  }
}
