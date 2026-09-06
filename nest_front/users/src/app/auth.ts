import type { AxiosError } from 'axios'
import { request } from '../api/request'
import type { ApiEnvelope, ApiErrorPayload } from '../api/types'

export type UserGender = 'male' | 'female' | 'unknown'

export interface UserProfile {
  id: number
  phone: string
  name: string
  gender: UserGender
  birthday: string | null
  address: string | null
  status: 'active' | 'disabled'
}

export interface UserSession {
  accessToken: string
  expiresIn: number
  user: UserProfile
}

export interface UserLoginInput {
  phone: string
  password: string
}

export interface UserRegistrationInput extends UserLoginInput {
  name: string
  gender: UserGender
  birthday: string | null
  address: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isUserGender(value: unknown): value is UserGender {
  return value === 'male' || value === 'female' || value === 'unknown'
}

function isAccountStatus(value: unknown): value is UserProfile['status'] {
  return value === 'active' || value === 'disabled'
}

function parseUserProfile(value: unknown): UserProfile {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' || !Number.isInteger(value.id) ||
    typeof value.phone !== 'string' ||
    typeof value.name !== 'string' ||
    !isUserGender(value.gender) ||
    !isAccountStatus(value.status) ||
    !(value.birthday === null || typeof value.birthday === 'string') ||
    !(value.address === null || typeof value.address === 'string')
  ) {
    throw new Error('服务器返回的用户会话数据格式无效。')
  }

  return { id: value.id, phone: value.phone, name: value.name, gender: value.gender, birthday: value.birthday, address: value.address, status: value.status }
}

export function parseUserSession(value: unknown): UserSession {
  if (!isRecord(value) || typeof value.accessToken !== 'string' || typeof value.expiresIn !== 'number' || !Number.isFinite(value.expiresIn)) {
    throw new Error('服务器返回的登录凭据格式无效。')
  }

  return {
    accessToken: value.accessToken,
    expiresIn: value.expiresIn,
    user: parseUserProfile(value.user),
  }
}

async function unwrapUserSession(response: Promise<{ data: ApiEnvelope<unknown> }>): Promise<UserSession> {
  const { data } = await response
  return parseUserSession(data.data)
}

export const userAuthApi = {
  login(input: UserLoginInput): Promise<UserSession> {
    return unwrapUserSession(request.post<ApiEnvelope<unknown>>('/api/v2/auth/user/login', input, { skipAuthRefresh: true }))
  },
  register(input: UserRegistrationInput): Promise<UserSession> {
    return unwrapUserSession(request.post<ApiEnvelope<unknown>>('/api/v2/auth/user/register', input, { skipAuthRefresh: true }))
  },
  refresh(): Promise<UserSession> {
    return unwrapUserSession(request.post<ApiEnvelope<unknown>>('/api/v2/auth/user/refresh', undefined, { skipAuthRefresh: true }))
  },
  async logout(): Promise<void> {
    await request.post('/api/v2/auth/user/logout', undefined, { skipAuthRefresh: true })
  },
}

export function getUserFacingError(error: unknown): string {
  const response = (error as AxiosError<ApiErrorPayload>).response
  if (typeof response?.data?.message === 'string') return response.data.message
  if ((error as AxiosError).code === 'ECONNABORTED') return '请求超时，请稍后重试。'
  if ((error as AxiosError).request) return '网络连接异常，请检查网络后重试。'
  return error instanceof Error ? error.message : '操作未完成，请稍后重试。'
}
