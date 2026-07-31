import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @IsString()
  password: string;
}
