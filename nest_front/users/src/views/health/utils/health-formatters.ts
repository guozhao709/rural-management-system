import type { MetricCreateInput, MetricType, TrendDirection } from '../types/health'

export const METRIC_LABELS: Record<MetricType, string> = {
  weight: '体重',
  temperature: '体温',
  heart_rate: '心率',
  blood_pressure: '血压',
  custom: '自定义指标',
}

export const METRIC_UNITS: Record<Exclude<MetricType, 'blood_pressure' | 'custom'>, string> = {
  weight: 'kg',
  temperature: '℃',
  heart_rate: 'bpm',
}

export const TREND_LABELS: Record<TrendDirection, string> = { up: '上升', down: '下降', stable: '基本稳定' }

export function metricLabel(type: MetricType): string {
  return METRIC_LABELS[type]
}

export function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '日期未知'
  return new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '未填写'
  return value.toFixed(digits).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1')
}

export function formatTrend(direction: TrendDirection): string {
  return TREND_LABELS[direction]
}

export function parsePositiveId(value: unknown): number {
  const id = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(id) || id <= 0) throw new Error('资源编号无效。')
  return id
}

export function buildMetricCreateInput(input: {
  metricType: MetricType
  value: string
  systolic: string
  diastolic: string
  templateId: string
  measuredAt: string
}): MetricCreateInput {
  if (!input.measuredAt || Number.isNaN(new Date(input.measuredAt).getTime())) throw new Error('请选择有效的测量时间。')
  if (input.metricType === 'blood_pressure') {
    const systolic = Number(input.systolic)
    const diastolic = Number(input.diastolic)
    if (!Number.isFinite(systolic) || !Number.isFinite(diastolic) || systolic <= 0 || diastolic <= 0) throw new Error('请输入有效的血压数值。')
    return { metricType: 'blood_pressure', systolic, diastolic, measuredAt: new Date(input.measuredAt).toISOString() }
  }
  const value = Number(input.value)
  if (!Number.isFinite(value) || value <= 0) throw new Error('请输入大于 0 的指标数值。')
  if (input.metricType === 'custom') {
    const templateId = Number(input.templateId)
    if (!Number.isInteger(templateId) || templateId <= 0) throw new Error('请选择有效的自定义指标。')
    return { metricType: 'custom', templateId, value, measuredAt: new Date(input.measuredAt).toISOString() }
  }
  return { metricType: input.metricType, value, measuredAt: new Date(input.measuredAt).toISOString() }
}
