import { describe, expect, it, vi } from 'vitest'
import { healthApi } from './health'

const request = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }))
vi.mock('../../../api/request', () => ({ request }))

const envelope = (data: unknown) => ({ data: { code: 200, message: '操作成功', data } })
const page = (items: unknown[], pageSize = 20) => envelope({ items, page: 1, pageSize, total: items.length })
const metric = { id: 1, metricType: 'temperature', value: 38.5, unit: '℃', measuredAt: '2026-09-13T20:30:00+08:00', createdAt: '2026-09-13T20:31:00+08:00' }
const profile = { id: 1, sex: 'self-described', birthDate: null, heightCm: null, smokingStatus: null, drinkingStatus: null, exerciseStatus: null, sleepStatus: null, healthHistory: null, allergies: null, createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z' }

describe('healthApi', () => {
  it('unwraps a paged metric response and serializes date-only filters', async () => {
    request.get.mockResolvedValue(page([metric]))
    await expect(healthApi.getMetrics({ page: 1, pageSize: 20, from: '2026-09-01', to: '2026-09-02' })).resolves.toMatchObject({ items: [{ id: 1, metricType: 'temperature', value: 38.5 }] })
    expect(request.get).toHaveBeenCalledWith('/api/health/metrics', { params: { page: 1, pageSize: 20, from: new Date('2026-09-01T00:00:00.000').toISOString(), to: new Date('2026-09-02T23:59:59.999').toISOString() } })
  })

  it('sends severe and over_a_week analysis input without an empty description', async () => {
    request.post.mockResolvedValue(envelope({ id: 1, summary: '请观察', concerns: [], factors: [], suggestions: [], medicalAdvice: '如加重请就医', references: [], createdAt: '2026-09-13T21:00:00+08:00' }))
    const input = { symptoms: ['fatigue'], severity: 'severe' as const, duration: 'over_a_week' as const }
    await healthApi.createAnalysis(input)
    expect(request.post).toHaveBeenCalledWith('/api/health/analyses', input, { timeout: 310_000 })
    expect(request.post.mock.calls[0][1]).not.toHaveProperty('userId')
  })

  it('accepts an analysis detail with an omitted description and preserves UNKNOWN snapshots', async () => {
    const detail = { id: 3, input: { symptoms: ['fatigue'], severity: 'severe', duration: 'over_a_week' }, context: { legacy: true }, result: { legacy: true }, createdAt: '2026-09-01T00:00:00Z' }
    request.get.mockResolvedValue(envelope(detail))
    await expect(healthApi.getAnalysis(3)).resolves.toEqual(detail)
  })

  it('parses an empty single-value trend with nullable statistics and stable direction', async () => {
    request.get.mockResolvedValue(envelope({ target: { type: 'custom', unit: null }, points: [], statistics: { latest: null, average: null, min: null, max: null, change: null, trend: 'stable' } }))
    await expect(healthApi.getTrend({ templateId: 4, from: '2026-09-01' })).resolves.toMatchObject({ target: { type: 'custom', unit: null }, points: [], statistics: { latest: null, average: null, min: null, max: null, change: null, trend: 'stable' } })
    expect(request.get).toHaveBeenCalledWith('/api/health/metrics/trend', { params: { templateId: 4, from: new Date('2026-09-01T00:00:00.000').toISOString() } })
  })

  it('omits unfilled trend dates and rejects malformed trend output', async () => {
    request.get.mockResolvedValueOnce(envelope({ target: { type: 'weight', unit: 'kg' }, points: [], statistics: { latest: null, average: null, min: null, max: null, change: null, trend: 'stable' } }))
    await healthApi.getTrend({ metricType: 'weight', from: undefined, to: undefined })
    expect(request.get).toHaveBeenCalledWith('/api/health/metrics/trend', { params: { metricType: 'weight' } })

    request.get.mockResolvedValueOnce(envelope({ target: { type: 'weight', unit: 'kg' }, points: [{ measuredAt: 'bad', value: '65' }], statistics: {} }))
    await expect(healthApi.getTrend({ metricType: 'weight' })).rejects.toThrow('格式无效')
  })

  it('keeps profile partial/null semantics and does not impose a sex enum', async () => {
    request.get.mockResolvedValueOnce(envelope(profile))
    await expect(healthApi.getProfile()).resolves.toMatchObject({ sex: 'self-described', birthDate: null, heightCm: null })
    request.put.mockResolvedValueOnce(envelope(profile))
    await healthApi.saveProfile({})
    expect(request.put).toHaveBeenCalledWith('/api/health/profile', {})
  })

  it('parses nullable knowledge URLs and endedAt patch clearing', async () => {
    const knowledge = { id: 4, title: '睡眠', summary: null, category: 'lifestyle', tags: [], sourceName: '机构', content: '规律作息。', source: { name: '机构', url: null }, createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z' }
    request.get.mockResolvedValueOnce(envelope(knowledge))
    await expect(healthApi.getKnowledgeDetail(4)).resolves.toMatchObject({ source: { url: null } })

    const template = { id: 2, name: '体温跟踪', metricName: '体温', unit: '℃', relatedSystemMetricType: null, startedAt: '2026-09-01T00:00:00Z', endedAt: null, createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z' }
    request.patch.mockResolvedValueOnce(envelope(template))
    await healthApi.updateTemplate(2, { endedAt: null })
    expect(request.patch).toHaveBeenCalledWith('/api/health/metric-templates/2', { endedAt: null })
  })

  it('uses the documented string active query and preserves legacy summary severity text', async () => {
    request.get.mockResolvedValueOnce(page([], 100))
    await healthApi.getTemplates('false')
    expect(request.get).toHaveBeenCalledWith('/api/health/metric-templates', { params: { active: 'false', page: 1, pageSize: 100 } })

    request.get.mockResolvedValueOnce(page([{ id: 1, symptoms: [], severity: 'legacy-value', summary: '历史记录', createdAt: '2026-09-01T00:00:00Z' }]))
    await expect(healthApi.getAnalyses()).resolves.toMatchObject({ items: [{ severity: 'legacy-value' }] })
  })

  it('unwraps a null delete envelope', async () => {
    request.delete.mockResolvedValue(envelope(null))
    await expect(healthApi.deleteMetric(1)).resolves.toBeUndefined()
  })
})
