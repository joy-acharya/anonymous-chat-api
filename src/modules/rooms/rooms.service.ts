import { Injectable } from '@nestjs/common';
import { db } from '../../db/db';
import { rooms } from '../../db/schema';
import { randomBytes } from 'crypto';
import { eq } from 'drizzle-orm';

@Injectable()
export class RoomsService {
  async create(name: string, userId: string) {
    const id = `room_${randomBytes(4).toString('hex')}`;

    const result = await db
      .insert(rooms)
      .values({
        id,
        name,
        createdBy: userId,
      })
      .returning();

    return result[0];
  }

  async findAll() {
    return db.select().from(rooms).where(eq(rooms.isDeleted, false));
  }

  async findOne(id: string) {
    const result = await db
      .select()
      .from(rooms)
      .where(eq(rooms.id, id))
      .limit(1);

    return result[0];
  }

  async delete(id: string) {
    await db.update(rooms).set({ isDeleted: true }).where(eq(rooms.id, id));

    return { success: true };
  }
}
