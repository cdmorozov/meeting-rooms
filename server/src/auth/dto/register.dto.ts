import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsString()
  @Length(1, 100)
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEmail()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @IsString()
  @Length(8, 72)
  password: string;
}
