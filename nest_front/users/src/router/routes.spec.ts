import { describe, expect, it } from 'vitest'
import { routes } from './routes'
import { router } from './index'

describe('user routes', () => {
  it('exposes the authenticated health entry without inventing a separate permission scope', () => {
    const health = routes.find(route => route.name === 'user-health')
    expect(health).toMatchObject({ path: '/health', name: 'user-health', meta: { requiresAuth: true } })
  })

  it('keeps login/register guest-only and unknown paths routed home', () => {
    expect(routes.find(route => route.name === 'user-login')?.meta).toEqual({ guestOnly: true })
    expect(routes.find(route => route.name === 'user-register')?.meta).toEqual({ guestOnly: true })
    expect(routes.at(-1)).toMatchObject({ path: '/:pathMatch(.*)*', redirect: '/home' })
    expect(router).toBeDefined()
  })
})
