import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

@Controller('rooms/:id/messages')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  findByRoom(
    @Param('id') roomId: string,
    @Query('limit') limit?: string,
    @Query('before') before?: string,
  ) {
    return this.messagesService.findByRoom(roomId, Number(limit), before);
  }

  @Post()
  create(
    @Param('id') roomId: string,
    @Body() body: CreateMessageDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.messagesService.create(roomId, body.content, user);
  }
}
