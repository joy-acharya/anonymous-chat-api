import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import { ApiException } from '../../../common/exceptions/api.exception';
import { AuthUser } from '../types';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiException(
        'UNAUTHORIZED',
        'Missing or expired session token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      throw new ApiException(
        'UNAUTHORIZED',
        'Missing or expired session token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const session = await this.redisService.getClient().get(`session:${token}`);

    if (!session) {
      throw new ApiException(
        'UNAUTHORIZED',
        'Missing or expired session token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = JSON.parse(session) as AuthUser;
    request.user = user;

    return true;
  }
}
