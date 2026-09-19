export type MetricType = 'weight' | 'temperature' | 'heart_rate' | 'blood_pressure' | 'custom'
export type TrendDirection = 'up' | 'down' | 'stable'
export type Severity = 'mild' | 'moderate' | 'severe'
export type AnalysisDuration = 'today' | '1_3_days' | '4_7_days' | 'over_a_week' | 'recurring'

export interface PageResult<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface HealthProfile {
  id: number
  sex: string | null
  birthDate: string | null
  heightCm: number | null
  smokingStatus: string | null
  drinkingStatus: string | null
  exerciseStatus: string | null
  sleepStatus: string | null
  healthHistory: string | null
  allergies: string | null
  createdAt: string
  updatedAt: string
}

export interface HealthProfileInput {
  sex?: string | null
  birthDate?: string | null
  heightCm?: number | null
  smokingStatus?: string | null
  drinkingStatus?: string | null
  exerciseStatus?: string | null
  sleepStatus?: string | null
  healthHistory?: string | null
  allergies?: string | null
}

export interface MetricRecord {
  id: number
  metricType: MetricType
  value?: number
  systolic?: number
  diastolic?: number
  unit: string
  measuredAt: string
  createdAt: string
}

export interface MetricFilters {
  metricType?: Exclude<MetricType, 'custom'>
  templateId?: number
  from?: string
  to?: string
  page: number
  pageSize: number
}

export type MetricCreateInput =
  | { metricType: 'weight' | 'temperature' | 'heart_rate'; value: number; measuredAt: string }
  | { metricType: 'blood_pressure'; systolic: number; diastolic: number; measuredAt: string }
  | { metricType: 'custom'; templateId: number; value: number; measuredAt: string }

export interface MetricTemplate {
  id: number
  name: string
  metricName: string
  unit: string
  relatedSystemMetricType: Exclude<MetricType, 'custom'> | null
  startedAt: string
  endedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface MetricTemplateInput {
  name: string
  metricName: string
  unit: string
  relatedSystemMetricType: Exclude<MetricType, 'custom'> | null
  startedAt: string
}

export interface MetricTemplatePatch {
  name?: string
  endedAt?: string | null
}

export interface MetricStatistics {
  latest: number | null
  average: number | null
  min: number | null
  max: number | null
  change: number | null
  trend: TrendDirection
}

export interface SingleValueTrend {
  target: { type: Exclude<MetricType, 'blood_pressure'>; unit: string | null }
  points: Array<{ measuredAt: string; value: number }>
  statistics: MetricStatistics
}

export interface BloodPressureTrend {
  target: { type: 'blood_pressure'; unit: 'mmHg' }
  points: Array<{ measuredAt: string; systolic: number; diastolic: number }>
  statistics: { systolic: MetricStatistics; diastolic: MetricStatistics }
}

export type MetricTrend = SingleValueTrend | BloodPressureTrend

export interface AnalysisInput {
  symptoms: string[]
  severity: Severity
  duration: AnalysisDuration
  description?: string
}

export interface AnalysisReference {
  knowledgeId: number
  title: string
  source: string
}

export interface HealthAnalysisResult {
  summary: string
  concerns: string[]
  factors: string[]
  suggestions: string[]
  medicalAdvice: string
  references: AnalysisReference[]
}

export interface HealthAnalysisSummary {
  id: number
  symptoms: string[]
  severity: string
  summary: string
  createdAt: string
}

export interface HealthAnalysisDetail {
  id: number
  input: Record<string, unknown>
  context: Record<string, unknown>
  result: Record<string, unknown>
  createdAt: string
}

export interface HealthAnalysisCreated extends HealthAnalysisResult {
  id: number
  createdAt: string
}

export interface KnowledgeSummary {
  id: number
  title: string
  summary: string | null
  category: string
  tags: string[]
  sourceName: string
}

export interface KnowledgeDetail extends KnowledgeSummary {
  content: string
  source: { name: string; url: string | null }
  createdAt: string
  updatedAt: string
}

export interface KnowledgeFilters {
  q?: string
  category?: string
  page: number
  pageSize: number
}
