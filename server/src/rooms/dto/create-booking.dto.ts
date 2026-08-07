import { Transform } from 'class-transformer';
import { IsISO8601, IsString, Length } from 'class-validator';

export class CreateBookingDto {
  @IsString({ message: "Назва обов'язкова" })
  @Length(1, 100, { message: 'Назва має бути від 1 до 100 символів' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsISO8601({}, { message: 'Некоректний час початку' })
  startAt: string;

  @IsISO8601({}, { message: 'Некоректний час завершення' })
  endAt: string;
}
