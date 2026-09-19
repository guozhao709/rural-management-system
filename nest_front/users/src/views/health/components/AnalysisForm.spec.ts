import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AnalysisForm from './AnalysisForm.vue'

const stubs = { 'van-button': { template: '<button type="submit"><slot /></button>' } }

describe('AnalysisForm', () => {
  it('requires a symptom or free description', async () => {
    const wrapper = mount(AnalysisForm, { props: { submitting: false, errorMessage: '' }, global: { stubs } })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('请选择至少一个症状')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })

  it('submits the four documented analysis inputs and preserves no user context', async () => {
    const wrapper = mount(AnalysisForm, { props: { submitting: false, errorMessage: '' }, global: { stubs } })
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.find('textarea').setValue('昨天开始头晕。')
    await wrapper.find('form').trigger('submit')
    const input = wrapper.emitted('submit')?.[0]?.[0] as Record<string, unknown>
    expect(input).toMatchObject({ symptoms: ['dizziness'], severity: 'mild', duration: 'today', description: '昨天开始头晕。' })
    expect(input).not.toHaveProperty('userId')
    expect(input).not.toHaveProperty('heightCm')
  })

  it('omits the optional description when it is blank', async () => {
    const wrapper = mount(AnalysisForm, { props: { submitting: false, errorMessage: '' }, global: { stubs } })
    await wrapper.find('input[type="checkbox"]').setValue(true)
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')?.[0]?.[0]).not.toHaveProperty('description')
  })
})
