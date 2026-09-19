import { describe, expect, it, vi } from 'vitest'

const request = vi.hoisted(() => ({ post: vi.fn() }))

vi.mock('../api/request', () => ({ request }))

import { getUserFacingError, parseUserSession, userAuthApi } from './auth'

describe('parseUserSession', () => {
  it('accepts the documented user login response data', () => {
    expect(parseUserSession({ accessToken: 'short-lived-token', expiresIn: 900, user: { id: 1, phone: '13800000000', name: '张三', gender: 'unknown', birthday: null, address: null, status: 'active' } })).toMatchObject({ accessToken: 'short-lived-token', user: { id: 1, status: 'active' } })
  })

  it('rejects malformed untrusted API data before it reaches session state', () => {
    expect(() => parseUserSession({ accessToken: 'token', expiresIn: 900, user: { id: '1' } })).toThrow('格式无效')
    expect(() => parseUserSession({ accessToken: null, expiresIn: 900, user: {} })).toThrow('登录凭据格式无效')
  })

  it('keeps authentication API calls on the approved endpoints', async () => {
    const session = { accessToken: 'token', expiresIn: 900, user: { id: 1, phone: '13800000000', name: '张三', gender: 'unknown', birthday: null, address: null, status: 'active' } }
    request.post.mockResolvedValue({ data: { code: 0, message: 'ok', data: session } })

    await userAuthApi.login({ phone: '13800000000', password: 'secret' })
    await userAuthApi.register({ phone: '13800000000', password: 'secret', name: '张三', gender: 'unknown', birthday: null, address: null })
    await userAuthApi.refresh()
    await userAuthApi.logout()

    expect(request.post.mock.calls.map(([url]) => url)).toEqual([
      '/api/v2/auth/user/login',
      '/api/v2/auth/user/register',
      '/api/v2/auth/user/refresh',
      '/api/v2/auth/user/logout',
    ])
  })
})

describe('getUserFacingError', () => {
  it('prefers server, timeout, network, and generic error messages in order', () => {
    expect(getUserFacingError({ response: { data: { message: '服务拒绝' } } })).toBe('服务拒绝')
    expect(getUserFacingError({ code: 'ECONNABORTED' })).toContain('超时')
    expect(getUserFacingError({ request: {} })).toContain('网络')
    expect(getUserFacingError(new Error('本地错误'))).toBe('本地错误')
    expect(getUserFacingError({})).toContain('操作未完成')
  })
})
