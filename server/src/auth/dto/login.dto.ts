import { Transform } from 'class-transformer';
import { IsEmail, IsString } from 'class-validator';
import { normalizedEmail } from '../../common/transforms';

export class LoginDto {
  @IsEmail({}, { message: 'Некоректний email' })
  @Transform(normalizedEmail)
  email: string;

  @IsString({ message: 'Введіть пароль' })
  password: string;
}
