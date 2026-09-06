import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AnalysisOutcome from './AnalysisOutcome.vue'
import type { AgricultureAnalysis } from '../types/agriculture'

const analysis: AgricultureAnalysis = {
  id: '42', cropId: 1, cropName: '小麦', regionCode: '610116', regionName: '长安区', status: 'succeeded', createdAt: '2026-09-06T00:00:00.000Z', completedAt: '2026-09-06T00:00:10.000Z',
  result: { schemaVersion: '1.0', overview: '当前苗情总体稳定。', suitability: { level: 'high', score: 86, reasons: ['墒情适宜'] }, risks: [{ type: 'pest', level: 'medium', description: '留意蚜虫', evidence: ['叶片检查'] }], actions: [{ priority: 'high', action: '加强田间巡查', timing: '本周内', rationale: '及早发现病虫害' }], knowledgeReferences: [], contextWarnings: ['实时天气未接入'], disclaimer: '仅供农业管理参考。' },
}

const stubs = {
  'van-notice-bar': { template: '<div><slot /></div>' },
  'van-cell-group': { template: '<section><slot /></section>' },
  'van-cell': { template: '<div>{{ $attrs.title }} {{ $attrs.label }}<slot /><slot name="value" /></div>' },
  'van-tag': { template: '<span><slot /></span>' },
  'van-empty': { template: '<div>empty</div>' },
}

describe('AnalysisOutcome', () => {
  it('shows validated analysis advice, risks, and the context warning', () => {
    const wrapper = mount(AnalysisOutcome, { props: { analysis }, global: { stubs } })

    expect(wrapper.text()).toContain('适宜种植（86 分）')
    expect(wrapper.text()).toContain('实时天气未接入')
    expect(wrapper.text()).toContain('留意蚜虫')
    expect(wrapper.text()).toContain('加强田间巡查')
    expect(wrapper.text()).toContain('仅供农业管理参考。')
  })
})
