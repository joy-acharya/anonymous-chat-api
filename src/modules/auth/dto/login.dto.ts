import { IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_]{2,24}$/, {
    message:
      'username must be between 2 and 24 characters and contain only letters, numbers, and underscores',
  })
  username!: string;
}
