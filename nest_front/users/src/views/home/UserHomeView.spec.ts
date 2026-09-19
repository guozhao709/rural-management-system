import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn().mockResolvedValue(undefined) }))
const authStore = vi.hoisted(() => ({ profile: { name: '测试用户' }, logout: vi.fn().mockResolvedValue(undefined) }))

vi.mock('vue-router', () => ({ useRouter: () => router }))
vi.mock('../../stores/auth', () => ({ useAuthStore: () => authStore }))

import UserHomeView from './UserHomeView.vue'

describe('UserHomeView', () => {
  it('offers the authenticated health entry and logs out through the existing session store', async () => {
    const wrapper = mount(UserHomeView, { global: { stubs: { 'van-button': { template: '<button><slot /></button>' } } } })

    expect(wrapper.text()).toContain('测试用户')
    await wrapper.get('button').trigger('click')
    expect(router.push).toHaveBeenCalledWith({ name: 'user-agriculture' })
    await wrapper.get('button:nth-of-type(2)').trigger('click')
    expect(router.push).toHaveBeenCalledWith({ name: 'user-health' })
    await wrapper.get('button:nth-of-type(3)').trigger('click')
    expect(authStore.logout).toHaveBeenCalledOnce()
    expect(router.replace).toHaveBeenCalledWith({ name: 'user-login' })
  })
})
