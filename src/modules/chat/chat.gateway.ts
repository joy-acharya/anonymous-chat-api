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
import { eq, and } from 'drizzle-orm';
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
      client.emit('error', { code: 404, message: 'Room not found' });
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
      client.emit('error', { code: 404, message: 'Room not found' });
      client.disconnect(true);
      return;
    }

    const user = JSON.parse(session) as { userId: string; username: string };

    client.data.user = user;
    client.data.roomId = roomId;

    await client.join(roomId);

    client.emit('room:joined', {
      activeUsers: [user.username],
    });
  }

  async handleDisconnect(client: Socket) {
    await client.leave(client.data.roomId);
  }

  @SubscribeMessage('room:leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() _body: unknown,
  ) {
    client.disconnect(true);
  }
}
