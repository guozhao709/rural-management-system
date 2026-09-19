import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({
  store: { isAuthenticated: false, restore: vi.fn() },
}))

vi.mock('../../stores/auth', () => ({ useAuthStore: () => auth.store }))

import { installAuthGuard } from './auth'

describe('installAuthGuard', () => {
  let guard: (to: { meta: Record<string, boolean>; fullPath: string }) => Promise<unknown>

  beforeEach(() => {
    auth.store.isAuthenticated = false
    auth.store.restore.mockReset()
    installAuthGuard({ beforeEach: (callback: unknown) => { guard = callback as typeof guard } } as never)
  })

  it('restores an authenticated session before entering protected health routes', async () => {
    auth.store.isAuthenticated = true
    await expect(guard({ meta: { requiresAuth: true }, fullPath: '/health' })).resolves.toBe(true)
    expect(auth.store.restore).toHaveBeenCalledOnce()
  })

  it('redirects unauthenticated users and preserves the requested path', async () => {
    await expect(guard({ meta: { requiresAuth: true }, fullPath: '/health' })).resolves.toEqual({ name: 'user-login', query: { redirect: '/health' } })
  })

  it('redirects authenticated users away from guest-only pages', async () => {
    auth.store.isAuthenticated = true
    await expect(guard({ meta: { guestOnly: true }, fullPath: '/login' })).resolves.toEqual({ name: 'user-home' })
  })
})
