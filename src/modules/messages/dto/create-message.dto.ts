import { IsString, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @MaxLength(1000, {
    message: 'Message content must not exceed 1000 characters',
  })
  content!: string;
}
