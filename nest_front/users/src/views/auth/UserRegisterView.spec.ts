import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ replace: vi.fn() }))
const authStore = vi.hoisted(() => ({ register: vi.fn() }))

vi.mock('vue-router', () => ({ useRouter: () => router }))
vi.mock('../../stores/auth', () => ({ useAuthStore: () => authStore }))

import UserRegisterView from './UserRegisterView.vue'

const stubs = {
  UserRegisterForm: { props: ['errorMessage'], template: '<div><p v-if="errorMessage" role="alert">{{ errorMessage }}</p><button @click="$emit(\'submit\', { phone: \'13800000000\', password: \'secret\', name: \'测试用户\', gender: \'unknown\', birthday: null, address: null })">注册并登录</button></div>' },
  RouterLink: { template: '<a><slot /></a>' },
}

describe('UserRegisterView', () => {
  it('redirects to home after registration', async () => {
    authStore.register.mockResolvedValueOnce(undefined)
    const wrapper = mount(UserRegisterView, { global: { stubs } })
    await wrapper.get('button').trigger('click')
    expect(authStore.register).toHaveBeenCalledWith(expect.objectContaining({ name: '测试用户' }))
    expect(router.replace).toHaveBeenCalledWith({ name: 'user-home' })
  })

  it('shows a user-facing error when registration fails', async () => {
    authStore.register.mockRejectedValueOnce(new Error('注册失败'))
    const wrapper = mount(UserRegisterView, { global: { stubs } })
    await wrapper.get('button').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.get('[role="alert"]').text()).toBe('注册失败')
  })
})
