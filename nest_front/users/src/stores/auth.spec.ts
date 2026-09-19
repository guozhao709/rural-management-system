import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authApi = vi.hoisted(() => ({ login: vi.fn(), register: vi.fn(), refresh: vi.fn(), logout: vi.fn() }))

vi.mock('../app/auth', () => ({ userAuthApi: authApi }))

import { useAuthStore } from './auth'

const session = { accessToken: 'access-token', expiresIn: 900, user: { id: 1, phone: '13800000000', name: '测试用户', gender: 'unknown' as const, birthday: null, address: null, status: 'active' as const } }

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    authApi.login.mockResolvedValue(session)
    authApi.register.mockResolvedValue(session)
    authApi.refresh.mockResolvedValue(session)
    authApi.logout.mockResolvedValue(undefined)
  })

  it('applies login and registration sessions and restores only once', async () => {
    const store = useAuthStore()
    await store.login({ phone: session.user.phone, password: 'secret' })
    expect(store.isAuthenticated).toBe(true)
    expect(store.profile?.name).toBe('测试用户')

    store.clearSession()
    await store.register({ phone: session.user.phone, password: 'secret', name: '测试用户', gender: 'unknown', birthday: null, address: null })
    expect(store.isAuthenticated).toBe(true)
    expect(await store.restore()).toBe(true)
    expect(authApi.refresh).not.toHaveBeenCalled()
  })

  it('refreshes a fresh store and clears state when refresh or logout fails', async () => {
    const restored = useAuthStore()
    expect(await restored.restore()).toBe(true)
    expect(restored.isAuthenticated).toBe(true)

    setActivePinia(createPinia())
    const failed = useAuthStore()
    authApi.refresh.mockRejectedValueOnce(new Error('expired'))
    expect(await failed.refresh()).toBe(false)
    expect(failed.isAuthenticated).toBe(false)

    await failed.login({ phone: session.user.phone, password: 'secret' })
    authApi.logout.mockRejectedValueOnce(new Error('logout failed'))
    await expect(failed.logout()).rejects.toThrow('logout failed')
    expect(failed.isAuthenticated).toBe(false)
    expect(failed.isRestored).toBe(true)
  })
})
