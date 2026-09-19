import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ replace: vi.fn() }))
const route = vi.hoisted(() => ({ query: { redirect: '/health' } }))
const authStore = vi.hoisted(() => ({ login: vi.fn() }))

vi.mock('vue-router', () => ({ useRouter: () => router, useRoute: () => route }))
vi.mock('../../stores/auth', () => ({ useAuthStore: () => authStore }))

import UserLoginView from './UserLoginView.vue'

const stubs = {
  UserLoginForm: { props: ['errorMessage'], template: '<div><p v-if="errorMessage" role="alert">{{ errorMessage }}</p><button @click="$emit(\'submit\', { phone: \'13800000000\', password: \'secret\' })">登录</button></div>' },
  RouterLink: { template: '<a><slot /></a>' },
}

describe('UserLoginView', () => {
  it('redirects to a safe in-app path after login', async () => {
    authStore.login.mockResolvedValueOnce(undefined)
    const wrapper = mount(UserLoginView, { global: { stubs } })
    await wrapper.get('button').trigger('click')
    expect(authStore.login).toHaveBeenCalledWith({ phone: '13800000000', password: 'secret' })
    expect(router.replace).toHaveBeenCalledWith('/health')
  })

  it('shows a user-facing error when login fails', async () => {
    authStore.login.mockRejectedValueOnce(new Error('登录失败'))
    const wrapper = mount(UserLoginView, { global: { stubs } })
    await wrapper.get('button').trigger('click')
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.get('[role="alert"]').text()).toBe('登录失败')
  })
})
