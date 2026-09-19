import { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { configureRequestAuth, request } from './request'

const requestInterceptor = request.interceptors.request.handlers![0]!.fulfilled as (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig
const responseRejectedInterceptor = request.interceptors.response.handlers![0]!.rejected as (error: AxiosError) => Promise<unknown>

function config(overrides: Partial<InternalAxiosRequestConfig> = {}): InternalAxiosRequestConfig {
  return { headers: new AxiosHeaders(), ...overrides } as InternalAxiosRequestConfig
}

describe('request authentication interceptors', () => {
  beforeEach(() => {
    configureRequestAuth({ getAccessToken: () => null, refresh: vi.fn(), onUnauthenticated: vi.fn() })
  })

  it('adds the bearer token unless auth refresh is skipped', () => {
    configureRequestAuth({ getAccessToken: () => 'access-token', refresh: vi.fn(), onUnauthenticated: vi.fn() })

    const withToken = requestInterceptor?.(config())
    const skipped = requestInterceptor?.(config({ skipAuthRefresh: true }))

    expect(withToken?.headers.get('Authorization')).toBe('Bearer access-token')
    expect(skipped?.headers.get('Authorization')).toBeUndefined()
  })

  it('passes through non-refreshable failures without changing auth state', async () => {
    const error = { response: { status: 500 }, config: config() } as AxiosError
    await expect(responseRejectedInterceptor?.(error)).rejects.toBe(error)
  })

  it('logs out after a failed refresh for a 401 response', async () => {
    const onUnauthenticated = vi.fn()
    const refresh = vi.fn().mockResolvedValue(false)
    configureRequestAuth({ getAccessToken: () => 'access-token', refresh, onUnauthenticated })
    const error = { response: { status: 401 }, config: config() } as AxiosError

    await expect(responseRejectedInterceptor?.(error)).rejects.toBe(error)
    expect(refresh).toHaveBeenCalledOnce()
    expect(onUnauthenticated).toHaveBeenCalledOnce()
  })

  it('does not retry a request that has already been retried or has no token', async () => {
    const refresh = vi.fn().mockResolvedValue(true)
    configureRequestAuth({ getAccessToken: () => null, refresh, onUnauthenticated: vi.fn() })
    const error = { response: { status: 401 }, config: config() } as AxiosError
    await expect(responseRejectedInterceptor?.(error)).rejects.toBe(error)
    expect(refresh).not.toHaveBeenCalled()

    configureRequestAuth({ getAccessToken: () => 'access-token', refresh, onUnauthenticated: vi.fn() })
    const retried = { response: { status: 401 }, config: config({ _authRetried: true }) } as AxiosError
    await expect(responseRejectedInterceptor?.(retried)).rejects.toBe(retried)
    expect(refresh).not.toHaveBeenCalled()
  })
})
