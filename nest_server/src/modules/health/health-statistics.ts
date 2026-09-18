export type Trend = 'up' | 'down' | 'stable';

export interface SeriesStatistics {
  latest: number | null;
  average: number | null;
  min: number | null;
  max: number | null;
  change: number | null;
  trend: Trend;
}

const round = (value: number): number => Number(value.toFixed(2));

export const calculateBmi = (heightCm: number, weightKg: number): number =>
  round(weightKg / (heightCm / 100) ** 2);

export const calculateSeriesStatistics = (values: number[]): SeriesStatistics => {
  if (values.length === 0)
    return { latest: null, average: null, min: null, max: null, change: null, trend: 'stable' };
  const first = values[0]!;
  const latest = values.at(-1)!;
  const change = round(latest - first);
  return {
    latest,
    average: round(values.reduce((sum, value) => sum + value, 0) / values.length),
    min: Math.min(...values),
    max: Math.max(...values),
    change,
    trend: change === 0 ? 'stable' : change > 0 ? 'up' : 'down',
  };
};
