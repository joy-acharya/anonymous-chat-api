import { HttpStatus, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db } from '../../db/db';
import { rooms } from '../../db/schema';
import { ApiException } from '../../common/exceptions/api.exception';
import { RedisService } from '../../redis/redis.service';
import type { AuthUser } from '../auth/types';

@Injectable()
export class RoomsService {
  constructor(private readonly redisService: RedisService) {}

  async create(name: string, user: AuthUser) {
    const id = `room_${randomBytes(4).toString('hex')}`;

    const existingRoom = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.name, name), eq(rooms.isDeleted, false)))
      .limit(1);

    if (existingRoom[0]) {
      throw new ApiException(
        'ROOM_NAME_TAKEN',
        'A room with this name already exists',
        HttpStatus.CONFLICT,
      );
    }

    const result = await db
      .insert(rooms)
      .values({
        id,
        name,
        createdBy: user.username,
      })
      .returning();

    const room = result[0];

    return {
      id: room.id,
      name: room.name,
      createdBy: room.createdBy,
      createdAt: room.createdAt.toISOString(),
    };
  }

  async findAll() {
    const roomRows = await db
      .select()
      .from(rooms)
      .where(eq(rooms.isDeleted, false));

    const mappedRooms = await Promise.all(
      roomRows.map(async (room) => {
        const activeUsers = await this.redisService
          .getClient()
          .scard(`room:${room.id}:active_users`);

        return {
          id: room.id,
          name: room.name,
          createdBy: room.createdBy,
          activeUsers,
          createdAt: room.createdAt.toISOString(),
        };
      }),
    );

    return {
      rooms: mappedRooms,
    };
  }

  async findOne(id: string) {
    const room = await this.findRoomOrFail(id);

    const activeUsers = await this.redisService
      .getClient()
      .scard(`room:${room.id}:active_users`);

    return {
      id: room.id,
      name: room.name,
      createdBy: room.createdBy,
      activeUsers,
      createdAt: room.createdAt.toISOString(),
    };
  }

  async delete(id: string, user: AuthUser) {
    const room = await this.findRoomOrFail(id);

    if (room.createdBy !== user.username) {
      throw new ApiException(
        'FORBIDDEN',
        'Only the room creator can delete this room',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.redisService.getClient().publish(
      'chat:events',
      JSON.stringify({
        event: 'room:deleted',
        roomId: room.id,
        payload: {
          roomId: room.id,
        },
      }),
    );

    await db.update(rooms).set({ isDeleted: true }).where(eq(rooms.id, id));

    await this.redisService.getClient().del(`room:${room.id}:active_users`);

    return {
      deleted: true,
    };
  }

  private async findRoomOrFail(id: string) {
    const result = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, id), eq(rooms.isDeleted, false)))
      .limit(1);

    const room = result[0];

    if (!room) {
      throw new ApiException(
        'ROOM_NOT_FOUND',
        `Room with id ${id} does not exist`,
        HttpStatus.NOT_FOUND,
      );
    }

    return room;
  }
}
