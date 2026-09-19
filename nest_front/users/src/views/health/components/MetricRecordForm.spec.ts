import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MetricRecordForm from './MetricRecordForm.vue'

const stubs = { 'van-button': { template: '<button type="submit"><slot /></button>' } }

describe('MetricRecordForm', () => {
  it('emits only blood pressure fields for the blood pressure branch', async () => {
    const wrapper = mount(MetricRecordForm, { props: { templates: [], submitting: false }, global: { stubs } })
    await wrapper.find('select').setValue('blood_pressure')
    const inputs = wrapper.findAll('input')
    await inputs[0].setValue('128')
    await inputs[1].setValue('82')
    await inputs[2].setValue('2026-09-13T20:30')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({ metricType: 'blood_pressure', systolic: 128, diastolic: 82 })
    expect(wrapper.emitted('submit')?.[0]?.[0]).not.toHaveProperty('unit')
  })

  it('shows a visible validation error instead of emitting an invalid request', async () => {
    const wrapper = mount(MetricRecordForm, { props: { templates: [], submitting: false }, global: { stubs } })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.text()).toContain('请输入大于 0')
    expect(wrapper.emitted('submit')).toBeUndefined()
  })
})
