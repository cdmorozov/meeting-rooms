import { validateBookingTime } from './validate-booking-time';

const NOW = new Date('2026-08-01T00:00:00Z');

describe('validateBookingTime', () => {
  it('accepts a valid booking within working hours', () => {
    const result = validateBookingTime(
      new Date('2026-08-10T06:00:00Z'),
      new Date('2026-08-10T07:00:00Z'),
      NOW,
    );
    expect(result).toBeNull();
  });

  it('rejects start time not aligned to 30 minutes', () => {
    const result = validateBookingTime(
      new Date('2026-08-10T06:05:00Z'),
      new Date('2026-08-10T07:00:00Z'),
      NOW,
    );
    expect(result).toBe('NOT_MULTIPLE_OF_30');
  });

  it('rejects a booking where start equals end (zero duration)', () => {
    const result = validateBookingTime(
      new Date('2026-08-10T06:00:00Z'),
      new Date('2026-08-10T06:00:00Z'),
      NOW,
    );
    expect(result).toBe('TOO_SHORT');
  });

  it('rejects duration longer than 4 hours', () => {
    const result = validateBookingTime(
      new Date('2026-08-10T06:00:00Z'),
      new Date('2026-08-10T10:30:00Z'),
      NOW,
    );
    expect(result).toBe('TOO_LONG');
  });

  it('rejects a booking that starts in the past', () => {
    const result = validateBookingTime(
      new Date('2020-01-01T06:00:00Z'),
      new Date('2020-01-01T07:00:00Z'),
      NOW,
    );
    expect(result).toBe('IN_PAST');
  });

  it('rejects a booking that starts before office opens', () => {
    const result = validateBookingTime(
      new Date('2026-08-10T05:00:00Z'),
      new Date('2026-08-10T06:00:00Z'),
      NOW,
    );
    expect(result).toBe('OUTSIDE_WORKING_HOURS');
  });

  it('rejects a booking that ends after office closes', () => {
    const result = validateBookingTime(
      new Date('2026-08-10T15:30:00Z'),
      new Date('2026-08-10T16:30:00Z'),
      NOW,
    );
    expect(result).toBe('OUTSIDE_WORKING_HOURS');
  });
});
