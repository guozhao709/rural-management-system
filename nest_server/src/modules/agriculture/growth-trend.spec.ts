import { calculateGrowthTrend } from './growth-trend';

const point = (value: number, day: number) => ({ value, recordedAt: new Date(`2026-09-${String(day).padStart(2, '0')}T00:00:00.000Z`) });

describe('calculateGrowthTrend', () => {
  it('returns insufficient_data when fewer than two records exist', () => {
    expect(calculateGrowthTrend([])).toEqual({ latestValue: null, change: null, averageChange: null, trend: 'insufficient_data' });
    expect(calculateGrowthTrend([point(10, 1)])).toEqual({ latestValue: 10, change: null, averageChange: null, trend: 'insufficient_data' });
  });
  it('calculates an increasing trend from chronological values', () => {
    expect(calculateGrowthTrend([point(10, 1), point(14, 3), point(16, 5)])).toEqual({ latestValue: 16, change: 6, averageChange: 3, trend: 'increasing' });
  });
  it('calculates stable and decreasing trends deterministically', () => {
    expect(calculateGrowthTrend([point(100, 1), point(100.5, 2)])).toMatchObject({ trend: 'stable', change: 0.5 });
    expect(calculateGrowthTrend([point(10, 1), point(6, 2)])).toMatchObject({ trend: 'decreasing', latestValue: 6, change: -4, averageChange: -4 });
  });
});
