import { describe, expect, it, vi } from 'vitest'
import { useHealthAnalysis } from './useHealthAnalysis'
import { useHealthKnowledge } from './useHealthKnowledge'
import { useHealthMetrics } from './useHealthMetrics'
import { useHealthProfile } from './useHealthProfile'

const api = vi.hoisted(() => ({
  getProfile: vi.fn(), saveProfile: vi.fn(), getMetrics: vi.fn(), createMetric: vi.fn(), deleteMetric: vi.fn(), getTrend: vi.fn(), getTemplates: vi.fn(), createTemplate: vi.fn(), updateTemplate: vi.fn(), getAnalyses: vi.fn(), createAnalysis: vi.fn(), getAnalysis: vi.fn(), getKnowledge: vi.fn(), getKnowledgeDetail: vi.fn(),
}))
vi.mock('../api/health', () => ({ healthApi: api }))

const profile = { id: 1, sex: 'male' as const, birthDate: '2006-07-09', heightCm: 175, smokingStatus: null, drinkingStatus: null, exerciseStatus: null, sleepStatus: null, healthHistory: null, allergies: null, createdAt: '2026-09-01', updatedAt: '2026-09-01' }
const record = { id: 1, metricType: 'weight' as const, value: 65, unit: 'kg', measuredAt: '2026-09-01', createdAt: '2026-09-01' }
const template = { id: 2, name: '体温跟踪', metricName: '体温', unit: '℃', relatedSystemMetricType: 'temperature' as const, startedAt: '2026-09-01', endedAt: null, createdAt: '2026-09-01', updatedAt: '2026-09-01' }

describe('health composables', () => {
  it('loads and saves a nullable profile', async () => {
    api.getProfile.mockResolvedValueOnce(null)
    api.saveProfile.mockResolvedValueOnce(profile)
    const state = useHealthProfile()
    await state.load()
    expect(state.loaded.value).toBe(true)
    expect(state.profile.value).toBeNull()
    expect(await state.save({ sex: 'male', birthDate: profile.birthDate, heightCm: 175, smokingStatus: null, drinkingStatus: null, exerciseStatus: null, sleepStatus: null, healthHistory: null, allergies: null })).toBe(true)
    expect(state.profile.value?.id).toBe(1)
  })

  it('coordinates metric records, templates, and trend refreshes', async () => {
    api.getMetrics.mockResolvedValue({ items: [record], page: 1, pageSize: 10, total: 1 })
    api.getTemplates.mockResolvedValue({ items: [template], page: 1, pageSize: 100, total: 1 })
    api.getTrend.mockResolvedValue({ target: { type: 'weight', unit: 'kg' }, points: [], statistics: { latest: null, average: null, min: null, max: null, change: null, trend: 'stable' } })
    api.createMetric.mockResolvedValue(record)
    api.deleteMetric.mockResolvedValue(undefined)
    api.createTemplate.mockResolvedValue(template)
    api.updateTemplate.mockResolvedValue({ ...template, endedAt: '2026-09-02' })
    const state = useHealthMetrics()
    await state.loadRecords(); await state.loadTemplates(); await state.loadTrend({ metricType: 'weight' })
    expect(state.records.value).toEqual([record])
    expect(state.templates.value).toEqual([template])
    expect(await state.createRecord({ metricType: 'weight', value: 65, measuredAt: '2026-09-01' })).toBe(true)
    expect(await state.deleteRecord(1)).toBe(true)
    expect(await state.createTemplate({ name: '体温跟踪', metricName: '体温', unit: '℃', relatedSystemMetricType: 'temperature', startedAt: '2026-09-01' })).toBe(true)
    expect(await state.updateTemplate(2, { endedAt: '2026-09-02' })).toBe(true)
  })

  it('keeps analysis submission state and supports paged history/detail', async () => {
    const summary = { id: 3, symptoms: ['fatigue'], severity: 'mild' as const, summary: '请观察', createdAt: '2026-09-01' }
    const detail = { id: 3, input: { symptoms: ['fatigue'], severity: 'mild' as const, duration: 'today' as const, description: '乏力' }, context: {}, result: { summary: '请观察', concerns: [], factors: [], suggestions: [], medicalAdvice: '如加重请就医', references: [] }, createdAt: '2026-09-01' }
    api.getAnalyses.mockResolvedValue({ items: [summary], page: 2, pageSize: 20, total: 21 })
    api.getAnalysis.mockResolvedValue(detail)
    api.createAnalysis.mockResolvedValue({ id: 3, summary: '请观察', concerns: [], factors: [], suggestions: [], medicalAdvice: '如加重请就医', references: [], createdAt: '2026-09-01' })
    const state = useHealthAnalysis()
    await state.loadHistory(2); await state.loadDetail(3)
    expect(state.page.value).toBe(2)
    expect(state.selected.value?.id).toBe(3)
    expect(await state.create(detail.input)).toBe(true)
    expect(state.submitting.value).toBe(false)
  })

  it('ignores stale knowledge results and loads a detail', async () => {
    let resolveFirst: ((value: unknown) => void) | undefined
    const first = new Promise(resolve => { resolveFirst = resolve })
    api.getKnowledge.mockReturnValueOnce(first).mockResolvedValueOnce({ items: [{ id: 2, title: '睡眠', summary: null, category: 'lifestyle', tags: [], sourceName: '机构' }], page: 1, pageSize: 10, total: 1 })
    api.getKnowledgeDetail.mockResolvedValue({ id: 2, title: '睡眠', summary: null, category: 'lifestyle', tags: [], sourceName: '机构', content: '规律作息。', source: { name: '机构', url: 'https://example.com' }, createdAt: '2026-09-01', updatedAt: '2026-09-01' })
    const state = useHealthKnowledge()
    const firstLoad = state.load()
    await state.load()
    resolveFirst?.({ items: [], page: 1, pageSize: 10, total: 0 })
    await firstLoad; await state.loadDetail(2)
    expect(state.items.value[0]?.title).toBe('睡眠')
    expect(state.selected.value?.content).toBe('规律作息。')
  })

  it('exposes knowledge loading failures and clears unavailable detail', async () => {
    api.getKnowledge.mockRejectedValueOnce(new Error('知识服务不可用'))
    const state = useHealthKnowledge()
    await state.load()
    expect(state.errorMessage.value).toBe('知识服务不可用')
    api.getKnowledgeDetail.mockRejectedValueOnce(new Error('详情不可用'))
    await state.loadDetail(2)
    expect(state.selected.value).toBeNull()
    expect(state.errorMessage.value).toBe('详情不可用')
  })
})
