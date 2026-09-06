import { describe, expect, it } from 'vitest'
import { parseAdminSession } from './auth'

describe('parseAdminSession', () => {
  it('accepts the documented administrator login response data', () => {
    expect(parseAdminSession({ accessToken: 'short-lived-token', expiresIn: 900, admin: { id: 1, username: 'admin01', phone: '13800000000', role: 'admin', status: 'active' } })).toMatchObject({ accessToken: 'short-lived-token', admin: { role: 'admin' } })
  })

  it('rejects a response with an unknown administrator role', () => {
    expect(() => parseAdminSession({ accessToken: 'token', expiresIn: 900, admin: { id: 1, username: 'admin01', phone: null, role: 'owner', status: 'active' } })).toThrow('格式无效')
  })
})
