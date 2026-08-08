import { IsUUID } from 'class-validator';

export class VerifyEmailDto {
  @IsUUID('4', { message: 'Посилання недійсне' })
  token: string;
}
