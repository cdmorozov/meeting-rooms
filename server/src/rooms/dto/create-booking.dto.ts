import { Transform } from 'class-transformer';
import {
  IsISO8601,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { trimmed } from '../../common/transforms';

export const MAX_REPEAT_COUNT = 12;

export class CreateBookingDto {
  @IsString({ message: "Назва обов'язкова" })
  @Length(1, 100, { message: 'Назва має бути від 1 до 100 символів' })
  @Transform(trimmed)
  title: string;

  @IsISO8601({}, { message: 'Некоректний час початку' })
  startAt: string;

  @IsISO8601({}, { message: 'Некоректний час завершення' })
  endAt: string;

  @IsOptional()
  @IsInt({ message: 'Кількість повторень має бути числом' })
  @Min(1, { message: 'Кількість повторень має бути від 1 до 12' })
  @Max(MAX_REPEAT_COUNT, {
    message: 'Кількість повторень має бути від 1 до 12',
  })
  repeatCount?: number;
}
