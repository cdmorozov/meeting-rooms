import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsString({ message: "Ім'я обов'язкове" })
  @Length(1, 100, { message: "Ім'я має бути від 1 до 100 символів" })
  @Transform(({ value }) => value?.trim())
  name: string;

  @IsEmail({}, { message: 'Некоректний email' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @IsString()
  @Length(8, 72, { message: 'Пароль має бути від 8 до 72 символів' })
  password: string;
}
