import { IsString, Matches } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9-]{3,32}$/, {
    message:
      'name must be between 3 and 32 characters and contain only letters, numbers, and hyphens',
  })
  name!: string;
}
