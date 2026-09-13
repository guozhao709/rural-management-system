import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import HealthSafetyResult from './HealthSafetyResult.vue'
import type { HealthAssessment } from '../types/health'

const emergencyAssessment: HealthAssessment = {
  id: 'assessment-1',
  status: 'succeeded',
  triage: { level: 'emergency', reasonCodes: ['RULE-1'], message: '请立即获得紧急医疗帮助。' },
  result: {
    schemaVersion: '1.0',
    triage: { level: 'emergency', reasonCodes: ['RULE-1'], message: '请立即获得紧急医疗帮助。' },
    summary: '当前信息提示应立即获得紧急医疗帮助。',
    factors: [], nextActions: ['立即拨打 120。'], selfCare: [], warningSignals: [], knowledgeReferences: [], limitations: ['本结果不构成诊断。'], aiGenerated: false, generatedAt: '2026-08-25T08:01:00.000Z',
  },
  aiGenerated: false, ruleVersion: 'development', createdAt: '2026-08-25T08:01:00.000Z', completedAt: '2026-08-25T08:01:00.000Z',
}

describe('HealthSafetyResult', () => {
  it('puts the 120 emergency instruction before the assessment explanation', () => {
    const wrapper = mount(HealthSafetyResult, { props: { assessment: emergencyAssessment } })

    expect(wrapper.get('[role="alert"]').text()).toContain('立即拨打 120 或前往急诊')
    expect(wrapper.text()).toContain(emergencyAssessment.result.summary)
  })

  it('uses a fail-safe message for insufficient information', () => {
    const wrapper = mount(HealthSafetyResult, {
      props: { assessment: { ...emergencyAssessment, triage: { level: 'insufficient', reasonCodes: [], message: '信息不足' }, result: { ...emergencyAssessment.result, triage: { level: 'insufficient', reasonCodes: [], message: '信息不足' } } } },
    })

    expect(wrapper.text()).toContain('暂时无法评估')
    expect(wrapper.text()).not.toContain('低风险')
  })

  it('keeps the information-insufficient warning while showing a validated AI explanation', () => {
    const wrapper = mount(HealthSafetyResult, {
      props: {
        assessment: {
          ...emergencyAssessment,
          aiGenerated: true,
          triage: { level: 'insufficient', reasonCodes: [], message: '信息不足' },
          result: {
            ...emergencyAssessment.result,
            triage: { level: 'insufficient', reasonCodes: [], message: '信息不足' },
            summary: 'AI 生成的补充健康说明。',
            aiGenerated: true,
          },
        },
      },
    })

    expect(wrapper.text()).toContain('暂时无法评估')
    expect(wrapper.text()).toContain('AI 生成的补充健康说明。')
    expect(wrapper.text()).toContain('此说明由 AI 生成')
  })
})
