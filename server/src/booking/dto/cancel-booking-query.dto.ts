import { IsIn, IsOptional } from 'class-validator';

export type CancelScope = 'one' | 'series';

export class CancelBookingQueryDto {
  @IsOptional()
  @IsIn(['one', 'series'], { message: 'scope має бути one або series' })
  scope?: CancelScope;
}
