import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { MessagesModule } from './modules/messages/messages.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
    AuthModule,
    RoomsModule,
    MessagesModule,
  ],
})
export class AppModule {}
