import { calculateBmi, calculateSeriesStatistics } from './health-statistics';

describe('health deterministic statistics', () => {
  it('calculates BMI from height and the latest weight', () => {
    expect(calculateBmi(175, 65.2)).toBe(21.29);
  });

  it('summarizes a rising series using documented fields', () => {
    expect(calculateSeriesStatistics([65.1, 65.8])).toEqual({
      latest: 65.8,
      average: 65.45,
      min: 65.1,
      max: 65.8,
      change: 0.7,
      trend: 'up',
    });
  });

  it('returns null values for an empty series rather than inventing health data', () => {
    expect(calculateSeriesStatistics([])).toEqual({
      latest: null,
      average: null,
      min: null,
      max: null,
      change: null,
      trend: 'stable',
    });
  });
});
