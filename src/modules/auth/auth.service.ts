import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db } from '../../db/db';
import { users } from '../../db/schema';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class AuthService {
  constructor(private readonly redisService: RedisService) {}

  async login(username: string) {
    const normalizedUsername = username.trim();

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.username, normalizedUsername))
      .limit(1);

    let user = existingUsers[0];

    if (!user) {
      const id = `usr_${randomBytes(4).toString('hex')}`;

      const insertedUsers = await db
        .insert(users)
        .values({
          id,
          username: normalizedUsername,
        })
        .returning();

      user = insertedUsers[0];
    }

    const sessionToken = randomBytes(32).toString('hex');
    const ttl = Number(process.env.SESSION_TTL_SECONDS ?? 86400);

    await this.redisService.getClient().set(
      `session:${sessionToken}`,
      JSON.stringify({
        userId: user.id,
        username: user.username,
      }),
      'EX',
      ttl,
    );

    return {
      sessionToken,
      user: {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt.toISOString(),
      },
    };
  }
}
