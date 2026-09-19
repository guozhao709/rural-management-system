import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UserLoginForm from './UserLoginForm.vue'
import UserRegisterForm from './UserRegisterForm.vue'

const stubs = {
  'van-form': { template: '<form><slot /></form>' },
  'van-cell-group': { template: '<div><slot /></div>' },
  'van-field': { template: '<input />' },
  'van-button': { template: '<button type="submit"><slot /></button>' },
}

describe('authentication forms', () => {
  it('emits the login input and displays an error', async () => {
    const wrapper = mount(UserLoginForm, { props: { loading: false, errorMessage: '登录失败' }, global: { stubs } })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([[{ phone: '', password: '' }]])
    expect(wrapper.get('[role="alert"]').text()).toBe('登录失败')
  })

  it('emits nullable registration fields and displays an error', async () => {
    const wrapper = mount(UserRegisterForm, { props: { loading: false, errorMessage: '注册失败' }, global: { stubs } })
    await wrapper.find('form').trigger('submit')
    expect(wrapper.emitted('submit')).toEqual([[{ phone: '', password: '', name: '', gender: 'unknown', birthday: null, address: null }]])
    expect(wrapper.get('[role="alert"]').text()).toBe('注册失败')
  })
})
