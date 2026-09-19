import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ProfileForm from './ProfileForm.vue'

const stubs = { 'van-button': { template: '<button type="submit"><slot /></button>' }, 'van-loading': { template: '<span><slot /></span>' } }

describe('ProfileForm', () => {
  it('renders the uncreated profile state and submits nullable fields', async () => {
    const wrapper = mount(ProfileForm, { props: { profile: null, loading: false, saving: false, errorMessage: '' }, global: { stubs } })
    expect(wrapper.text()).toContain('待建档')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('save')?.[0]?.[0]).toMatchObject({ sex: null, birthDate: null, heightCm: null, allergies: null })
  })

  it('renders loading and rejects an invalid height before submitting', async () => {
    const loading = mount(ProfileForm, { props: { profile: null, loading: true, saving: false, errorMessage: '' }, global: { stubs } })
    expect(loading.text()).toContain('正在加载档案')

    const wrapper = mount(ProfileForm, { props: { profile: { id: 1, sex: 'male', birthDate: '2006-07-09', heightCm: 175, smokingStatus: null, drinkingStatus: null, exerciseStatus: null, sleepStatus: null, healthHistory: null, allergies: null, createdAt: '2026-09-01', updatedAt: '2026-09-01' }, loading: false, saving: false, errorMessage: '服务器暂不可用' }, global: { stubs } })
    expect(wrapper.text()).toContain('已建档')
    await wrapper.get('input[type="number"]').setValue('-1')
    await wrapper.find('form').trigger('submit')
    expect(wrapper.get('[role="alert"]').text()).toContain('身高必须')
    expect(wrapper.emitted('save')).toBeUndefined()
  })
})
