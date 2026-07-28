import { intervalsOverlap } from './overlap';

describe('intervalsOverlap', () => {
  it('back-to-back intervals do not overlap', () => {
    const result = intervalsOverlap(
      new Date('2026-08-01T10:00:00Z'),
      new Date('2026-08-01T11:00:00Z'),
      new Date('2026-08-01T11:00:00Z'),
      new Date('2026-08-01T12:00:00Z'),
    );
    expect(result).toBe(false);
  });

  it('partial overlap overlaps', () => {
    const result = intervalsOverlap(
      new Date('2026-08-01T10:00:00Z'),
      new Date('2026-08-01T11:00:00Z'),
      new Date('2026-08-01T10:30:00Z'),
      new Date('2026-08-01T11:30:00Z'),
    );
    expect(result).toBe(true);
  });

  it('identical intervals overlap', () => {
    const result = intervalsOverlap(
      new Date('2026-08-01T10:00:00Z'),
      new Date('2026-08-01T11:00:00Z'),
      new Date('2026-08-01T10:00:00Z'),
      new Date('2026-08-01T11:00:00Z'),
    );
    expect(result).toBe(true);
  });

  it('same time on adjacent days does not overlap', () => {
    const result = intervalsOverlap(
      new Date('2026-08-01T10:00:00Z'),
      new Date('2026-08-01T11:00:00Z'),
      new Date('2026-08-02T10:00:00Z'),
      new Date('2026-08-02T11:00:00Z'),
    );
    expect(result).toBe(false);
  });
});
