import { Matches } from 'class-validator';

export class WeekBookingsQueryDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'weekStart має бути датою у форматі РРРР-ММ-ДД',
  })
  weekStart: string;
}
