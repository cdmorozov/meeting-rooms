import { IsIn, IsOptional, IsUUID } from 'class-validator';

export class MyBookingsQueryDto {
  @IsIn(['upcoming', 'past'], { message: 'scope має бути upcoming або past' })
  scope: 'upcoming' | 'past';

  @IsOptional()
  @IsUUID('4', { message: 'cursor має бути ідентифікатором бронювання' })
  cursor?: string;
}
