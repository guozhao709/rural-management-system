import { describe, expect, it } from 'vitest'
import { buildMetricCreateInput, formatNumber, formatTrend, metricLabel, parsePositiveId } from './health-formatters'

describe('health formatters and metric request builder', () => {
  it('builds a single-value request without client-provided unit', () => {
    expect(buildMetricCreateInput({ metricType: 'weight', value: '65.2', systolic: '', diastolic: '', templateId: '', measuredAt: '2026-09-13T20:30' })).toMatchObject({ metricType: 'weight', value: 65.2 })
    expect(buildMetricCreateInput({ metricType: 'custom', value: '38.5', systolic: '', diastolic: '', templateId: '3', measuredAt: '2026-09-13T20:30' })).toMatchObject({ metricType: 'custom', value: 38.5, templateId: 3 })
  })

  it('builds the blood pressure discriminated branch', () => {
    expect(buildMetricCreateInput({ metricType: 'blood_pressure', value: '', systolic: '128', diastolic: '82', templateId: '', measuredAt: '2026-09-13T20:30' })).toMatchObject({ metricType: 'blood_pressure', systolic: 128, diastolic: 82 })
  })

  it('rejects invalid values, dates, and custom template ids', () => {
    expect(() => buildMetricCreateInput({ metricType: 'weight', value: '0', systolic: '', diastolic: '', templateId: '', measuredAt: '2026-09-13T20:30' })).toThrow('大于 0')
    expect(() => buildMetricCreateInput({ metricType: 'blood_pressure', value: '', systolic: '128', diastolic: '', templateId: '', measuredAt: '2026-09-13T20:30' })).toThrow('血压')
    expect(() => buildMetricCreateInput({ metricType: 'custom', value: '3', systolic: '', diastolic: '', templateId: 'bad', measuredAt: '2026-09-13T20:30' })).toThrow('自定义指标')
    expect(() => buildMetricCreateInput({ metricType: 'weight', value: '3', systolic: '', diastolic: '', templateId: '', measuredAt: '' })).toThrow('测量时间')
  })

  it('formats labels, numbers, trends, and resource ids safely', () => {
    expect(metricLabel('heart_rate')).toBe('心率')
    expect(formatNumber(12.5, 2)).toBe('12.5')
    expect(formatNumber(null)).toBe('未填写')
    expect(formatTrend('stable')).toBe('基本稳定')
    expect(parsePositiveId('4')).toBe(4)
    expect(() => parsePositiveId('0')).toThrow('无效')
  })
})
