export const SYSTEM_METRIC_TYPES = ['weight', 'blood_pressure', 'heart_rate', 'temperature'] as const;
export type SystemMetricType = (typeof SYSTEM_METRIC_TYPES)[number];
export type MetricType = SystemMetricType | 'custom';

export interface HealthAnalysisInput {
  symptoms: string[];
  severity: 'mild' | 'moderate' | 'severe';
  duration: 'today' | '1_3_days' | '4_7_days' | 'over_a_week' | 'recurring';
  description?: string;
}

export interface HealthAnalysisResult {
  summary: string;
  concerns: string[];
  factors: string[];
  suggestions: string[];
  medicalAdvice: string;
  references: Array<{ knowledgeId: number; title: string; source: string }>;
}
