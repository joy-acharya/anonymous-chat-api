import { HttpStatus, Injectable } from '@nestjs/common';
import { and, desc, eq, lt } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db } from '../../db/db';
import { messages, rooms } from '../../db/schema';
import { ApiException } from '../../common/exceptions/api.exception';
import { AuthUser } from '../auth/types';

@Injectable()
export class MessagesService {
  async findByRoom(roomId: string, limit = 50, before?: string) {
    const room = await this.findRoomOrFail(roomId);

    const safeLimit = Math.min(Number(limit) || 50, 100);

    let beforeDate: Date | undefined;

    if (before) {
      const cursorMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.id, before))
        .limit(1);

      beforeDate = cursorMessages[0]?.createdAt;
    }

    const whereCondition = beforeDate
      ? and(eq(messages.roomId, room.id), lt(messages.createdAt, beforeDate))
      : eq(messages.roomId, room.id);

    const rows = await db
      .select()
      .from(messages)
      .where(whereCondition)
      .orderBy(desc(messages.createdAt))
      .limit(safeLimit + 1);

    const hasMore = rows.length > safeLimit;
    const pageRows = rows.slice(0, safeLimit);

    return {
      messages: pageRows.map((message) => ({
        id: message.id,
        roomId: message.roomId,
        username: message.username,
        content: message.content,
        createdAt: message.createdAt.toISOString(),
      })),
      hasMore,
      nextCursor:
        hasMore && pageRows.length > 0
          ? pageRows[pageRows.length - 1].id
          : null,
    };
  }

  async create(roomId: string, content: string, user: AuthUser) {
    const room = await this.findRoomOrFail(roomId);

    const trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new ApiException(
        'MESSAGE_EMPTY',
        'Message content must not be empty',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    if (trimmedContent.length > 1000) {
      throw new ApiException(
        'MESSAGE_TOO_LONG',
        'Message content must not exceed 1000 characters',
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const id = `msg_${randomBytes(4).toString('hex')}`;

    const insertedMessages = await db
      .insert(messages)
      .values({
        id,
        roomId: room.id,
        userId: user.userId,
        username: user.username,
        content: trimmedContent,
      })
      .returning();

    const message = insertedMessages[0];

    return {
      id: message.id,
      roomId: message.roomId,
      username: message.username,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    };
  }

  private async findRoomOrFail(roomId: string) {
    const result = await db
      .select()
      .from(rooms)
      .where(and(eq(rooms.id, roomId), eq(rooms.isDeleted, false)))
      .limit(1);

    const room = result[0];

    if (!room) {
      throw new ApiException(
        'ROOM_NOT_FOUND',
        `Room with id ${roomId} does not exist`,
        HttpStatus.NOT_FOUND,
      );
    }

    return room;
  }
}
