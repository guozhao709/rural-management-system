export type GrowthTrend = 'increasing' | 'stable' | 'decreasing' | 'insufficient_data';
export interface TrendPoint { value: number; recordedAt: Date; }
export const calculateGrowthTrend = (points: TrendPoint[]) => {
  if (points.length === 0) return { latestValue: null, change: null, averageChange: null, trend: 'insufficient_data' as GrowthTrend };
  const ordered = [...points].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  const latestValue = ordered.at(-1)!.value;
  if (ordered.length < 2) return { latestValue, change: null, averageChange: null, trend: 'insufficient_data' as GrowthTrend };
  const firstValue = ordered[0]!.value;
  const change = latestValue - firstValue;
  const averageChange = change / (ordered.length - 1);
  const tolerance = Math.max(Math.abs(firstValue) * 0.01, 0.0001);
  return { latestValue, change, averageChange, trend: change > tolerance ? 'increasing' as GrowthTrend : change < -tolerance ? 'decreasing' as GrowthTrend : 'stable' as GrowthTrend };
};
