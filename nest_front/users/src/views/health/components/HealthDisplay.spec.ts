import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AnalysisResult from './AnalysisResult.vue'
import KnowledgeList from './KnowledgeList.vue'
import MetricHistory from './MetricHistory.vue'
import MetricTemplatePanel from './MetricTemplatePanel.vue'
import MetricTrendChart from './MetricTrendChart.vue'

const stubs = {
  'van-button': { template: '<button type="submit"><slot /></button>' },
  'van-empty': { template: '<div class="empty">{{ $attrs.description }}<slot /></div>' },
  'van-loading': { template: '<div class="loading"><slot /></div>' },
}

describe('health display components', () => {
  it('shows a metric empty state and asks before deleting a record', async () => {
    const empty = mount(MetricHistory, { props: { records: [], loading: false, total: 0, page: 1, pageSize: 10, deletingId: null }, global: { stubs } })
    expect(empty.text()).toContain('暂无指标记录')
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const wrapper = mount(MetricHistory, { props: { records: [{ id: 1, metricType: 'weight', value: 65.2, unit: 'kg', measuredAt: '2026-09-13T20:30:00+08:00', createdAt: '2026-09-13T20:31:00+08:00' }], loading: false, total: 1, page: 1, pageSize: 10, deletingId: null }, global: { stubs } })
    await wrapper.get('button').trigger('click')
    expect(confirm).toHaveBeenCalled()
    expect(wrapper.emitted('delete')).toEqual([[1]])
    confirm.mockRestore()
  })

  it('renders both single-value and blood-pressure trend states', () => {
    const single = mount(MetricTrendChart, { props: { loading: false, trend: { target: { type: 'weight', unit: 'kg' }, points: [{ measuredAt: '2026-09-01', value: 65 }, { measuredAt: '2026-09-02', value: 66 }], statistics: { latest: 66, average: 65.5, min: 65, max: 66, change: 1, trend: 'up' } } }, global: { stubs } })
    expect(single.text()).toContain('上升')
    const blood = mount(MetricTrendChart, { props: { loading: false, trend: { target: { type: 'blood_pressure', unit: 'mmHg' }, points: [{ measuredAt: '2026-09-01', systolic: 125, diastolic: 80 }], statistics: { systolic: { latest: 125, average: 125, min: 125, max: 125, change: 0, trend: 'stable' }, diastolic: { latest: 80, average: 80, min: 80, max: 80, change: 0, trend: 'stable' } } } }, global: { stubs } })
    expect(blood.text()).toContain('收缩压')
    expect(blood.text()).toContain('舒张压')
  })

  it('renders an empty trend with nullable unit and statistics', () => {
    const wrapper = mount(MetricTrendChart, { props: { loading: false, trend: { target: { type: 'custom', unit: null }, points: [], statistics: { latest: null, average: null, min: null, max: null, change: null, trend: 'stable' } } }, global: { stubs } })
    expect(wrapper.text()).toContain('选择指标后查看趋势')
    expect(wrapper.text()).not.toContain('undefined')
  })

  it('emits template creation and renders analysis references', async () => {
    const template = mount(MetricTemplatePanel, { props: { templates: [], loading: false, saving: false }, global: { stubs } })
    await template.find('input[aria-label="模板名称"]').setValue('发烧期间体温')
    await template.find('input[aria-label="指标名称"]').setValue('体温')
    await template.find('input[aria-label="单位"]').setValue('℃')
    await template.find('form').trigger('submit')
    expect(template.emitted('create')).toHaveLength(1)
    const result = mount(AnalysisResult, { props: { result: { summary: '请观察', concerns: [], factors: ['睡眠不足可能相关'], suggestions: ['适当休息'], medicalAdvice: '如加重请就医', references: [{ knowledgeId: 9, title: '睡眠建议', source: '健康机构' }] } }, global: { stubs } })
    await result.get('button.reference').trigger('click')
    expect(result.emitted('knowledge')).toEqual([[9]])
    expect(result.text()).toContain('不构成疾病诊断')
  })

  it('searches knowledge and exposes the empty state', async () => {
    const wrapper = mount(KnowledgeList, { props: { items: [], loading: false, errorMessage: '', total: 0, page: 1, pageSize: 10, filters: { q: '', category: '', page: 1, pageSize: 10 } }, global: { stubs } })
    await wrapper.get('input[aria-label="搜索健康知识"]').setValue('血压')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.emitted('search')).toEqual([[{ q: '血压', category: '' }]])
    expect(wrapper.text()).toContain('暂无匹配的健康知识')
  })
})
