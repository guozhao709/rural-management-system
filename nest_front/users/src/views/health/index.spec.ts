import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ push: vi.fn() }))
const healthMocks = vi.hoisted(() => ({
  profile: { profile: null, loading: false, saving: false, errorMessage: '', load: vi.fn(), save: vi.fn() },
  metrics: {
    records: [], templates: [], trend: null, total: 0, loadingRecords: false, loadingTemplates: false, loadingTrend: false, saving: false, deletingId: null, errorMessage: '',
    filters: { metricType: 'weight', page: 1, pageSize: 10 }, loadRecords: vi.fn(), loadTemplates: vi.fn(), loadTrend: vi.fn(), createRecord: vi.fn(), deleteRecord: vi.fn(), createTemplate: vi.fn(), updateTemplate: vi.fn(),
  },
  analysis: { history: [], selected: null, total: 0, page: 1, loadingHistory: false, loadingDetail: false, submitting: false, errorMessage: '', loadHistory: vi.fn(), loadDetail: vi.fn(), create: vi.fn() },
  knowledge: { items: [], selected: null, loading: false, loadingDetail: false, total: 0, filters: { q: '', category: '', page: 1, pageSize: 10 }, errorMessage: '', load: vi.fn(), loadDetail: vi.fn() },
}))

vi.mock('vue-router', () => ({ useRouter: () => router }))
vi.mock('./composables/useHealthProfile', () => ({ useHealthProfile: () => healthMocks.profile }))
vi.mock('./composables/useHealthMetrics', () => ({ useHealthMetrics: () => healthMocks.metrics }))
vi.mock('./composables/useHealthAnalysis', () => ({ useHealthAnalysis: () => healthMocks.analysis }))
vi.mock('./composables/useHealthKnowledge', () => ({ useHealthKnowledge: () => healthMocks.knowledge }))

import HealthServiceView from './index.vue'

const vanStubs = {
  'van-nav-bar': { props: ['title'], template: '<button class="nav-bar" @click="$emit(\'click-left\')">{{ title }}</button>' },
  'van-tabs': { template: '<div><slot /></div>' },
  'van-tab': { props: ['title'], template: '<section><h2>{{ title }}</h2><slot /></section>' },
  'van-popup': { template: '<div><slot /></div>' },
  'van-loading': { template: '<span><slot /></span>' },
  'van-empty': { template: '<div>{{ $attrs.description }}<slot /></div>' },
  'van-button': { template: '<button><slot /></button>' },
  ProfileForm: { template: '<button class="profile-save" @click="$emit(\'save\', { sex: null, birthDate: null, heightCm: null, smokingStatus: null, drinkingStatus: null, exerciseStatus: null, sleepStatus: null, healthHistory: null, allergies: null })">save</button>' },
  MetricRecordForm: { template: '<button class="metric-create" @click="$emit(\'submit\', { metricType: \'weight\', value: 65, measuredAt: \'2026-09-13T20:00:00+08:00\' })">create metric</button>' },
  MetricHistory: { template: '<button class="metric-delete" @click="$emit(\'delete\', 1)">delete metric</button>' },
  MetricTemplatePanel: { template: '<div><button class="template-create" @click="$emit(\'create\', { name: \'观察期\', metricName: \'体重\', unit: \'kg\', relatedSystemMetricType: \'weight\', startedAt: \'2026-09-13T20:00:00+08:00\' })">create template</button><button class="template-end" @click="$emit(\'end\', 2)">end template</button></div>' },
  AnalysisForm: { template: '<button class="analysis-create" @click="$emit(\'submit\', { symptoms: [\'fatigue\'], severity: \'mild\', duration: \'today\', description: \'乏力\' })">create analysis</button>' },
  KnowledgeList: { template: '<button class="knowledge-search" @click="$emit(\'search\', { q: \'睡眠\', category: \'lifestyle\' })">search knowledge</button>' },
}

describe('HealthServiceView', () => {
  it('loads each read-only health section and provides the authenticated page shell', async () => {
    const wrapper = mount(HealthServiceView, { global: { stubs: vanStubs } })

    expect(wrapper.get('h1').text()).toBe('照顾好每一次记录')
    expect(wrapper.text()).toContain('健康档案')
    expect(wrapper.text()).toContain('指标趋势')
    expect(wrapper.text()).toContain('AI 分析')
    expect(wrapper.text()).toContain('健康知识')
    expect(healthMocks.profile.load).toHaveBeenCalledOnce()
    expect(healthMocks.metrics.loadRecords).toHaveBeenCalledOnce()
    expect(healthMocks.metrics.loadTemplates).toHaveBeenCalledOnce()
    expect(healthMocks.metrics.loadTrend).toHaveBeenCalledWith({ metricType: 'weight' })
    expect(healthMocks.analysis.loadHistory).toHaveBeenCalledOnce()
    expect(healthMocks.knowledge.load).toHaveBeenCalledOnce()

    await wrapper.get('.nav-bar').trigger('click')
    expect(router.push).toHaveBeenCalledWith({ name: 'user-home' })

    await wrapper.get('.profile-save').trigger('click')
    await wrapper.get('.metric-create').trigger('click')
    await wrapper.get('.metric-delete').trigger('click')
    await wrapper.get('.template-create').trigger('click')
    await wrapper.get('.template-end').trigger('click')
    await wrapper.get('.analysis-create').trigger('click')
    await wrapper.get('.knowledge-search').trigger('click')
    expect(healthMocks.profile.save).toHaveBeenCalledOnce()
    expect(healthMocks.metrics.createRecord).toHaveBeenCalledOnce()
    expect(healthMocks.metrics.deleteRecord).toHaveBeenCalledWith(1)
    expect(healthMocks.metrics.createTemplate).toHaveBeenCalledOnce()
    expect(healthMocks.metrics.updateTemplate).toHaveBeenCalledWith(2, expect.objectContaining({ endedAt: expect.any(String) }))
    expect(healthMocks.analysis.create).toHaveBeenCalledOnce()
    expect(healthMocks.knowledge.load).toHaveBeenCalledWith()
  })

  it('surfaces a load failure instead of hiding it', async () => {
    healthMocks.metrics.loadTemplates.mockRejectedValueOnce(new Error('模板服务不可用'))
    const wrapper = mount(HealthServiceView, { global: { stubs: vanStubs } })
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.get('[role="alert"]').text()).toContain('模板服务不可用')
  })

  it('does not render an invalid source link when knowledge has no URL', () => {
    const knowledgeMock = healthMocks.knowledge as { selected: unknown }
    knowledgeMock.selected = { id: 4, title: '睡眠', summary: null, category: 'lifestyle', tags: [], sourceName: '机构', content: '规律作息。', source: { name: '机构', url: null }, createdAt: '2026-09-01', updatedAt: '2026-09-01' }
    const wrapper = mount(HealthServiceView, { global: { stubs: vanStubs } })
    expect(wrapper.find('.knowledge-detail a').exists()).toBe(false)
    expect(wrapper.text()).toContain('暂无来源链接')
    knowledgeMock.selected = null
  })
})
