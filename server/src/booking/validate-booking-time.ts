import { DateTime } from 'luxon';

export const OFFICE_ZONE = 'Europe/Kyiv';
const WORKING_HOURS_START = 9;
const WORKING_HOURS_END = 19;
const MIN_DURATION_MINUTES = 30;
const MAX_DURATION_MINUTES = 4 * 60;

export type BookingTimeError =
  | 'NOT_MULTIPLE_OF_30'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'IN_PAST'
  | 'OUTSIDE_WORKING_HOURS';

export function validateBookingTime(
  startAt: Date,
  endAt: Date,
  now: Date,
): BookingTimeError | null {
  const start = DateTime.fromJSDate(startAt).setZone(OFFICE_ZONE);
  const end = DateTime.fromJSDate(endAt).setZone(OFFICE_ZONE);

  if (
    start.minute % 30 !== 0 ||
    start.second !== 0 ||
    end.minute % 30 !== 0 ||
    end.second !== 0
  ) {
    return 'NOT_MULTIPLE_OF_30';
  }

  const durationMinutes = end.diff(start, 'minutes').minutes;
  if (durationMinutes < MIN_DURATION_MINUTES) {
    return 'TOO_SHORT';
  }
  if (durationMinutes > MAX_DURATION_MINUTES) {
    return 'TOO_LONG';
  }

  if (startAt.getTime() <= now.getTime()) {
    return 'IN_PAST';
  }

  const dayStart = start.set({
    hour: WORKING_HOURS_START,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  const dayEnd = start.set({
    hour: WORKING_HOURS_END,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  if (start < dayStart || end > dayEnd) {
    return 'OUTSIDE_WORKING_HOURS';
  }

  return null;
}
