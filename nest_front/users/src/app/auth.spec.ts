import { describe, expect, it } from 'vitest'
import { parseUserSession } from './auth'

describe('parseUserSession', () => {
  it('accepts the documented user login response data', () => {
    expect(parseUserSession({ accessToken: 'short-lived-token', expiresIn: 900, user: { id: 1, phone: '13800000000', name: '张三', gender: 'unknown', birthday: null, address: null, status: 'active' } })).toMatchObject({ accessToken: 'short-lived-token', user: { id: 1, status: 'active' } })
  })

  it('rejects malformed untrusted API data before it reaches session state', () => {
    expect(() => parseUserSession({ accessToken: 'token', expiresIn: 900, user: { id: '1' } })).toThrow('格式无效')
  })
})
