import type { AxiosError } from 'axios'
import { request } from '../api/request'
import type { ApiEnvelope, ApiErrorPayload } from '../api/types'

export type AdminRole = 'admin' | 'super_admin'
export interface AdminProfile { id: number; username: string; phone: string | null; role: AdminRole; status: 'active' | 'disabled' }
export interface AdminSession { accessToken: string; expiresIn: number; admin: AdminProfile }
export interface AdminLoginInput { username: string; password: string }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null }
function isAdminRole(value: unknown): value is AdminRole { return value === 'admin' || value === 'super_admin' }
function isAccountStatus(value: unknown): value is AdminProfile['status'] { return value === 'active' || value === 'disabled' }
function parseAdminProfile(value: unknown): AdminProfile {
  if (!isRecord(value) || typeof value.id !== 'number' || !Number.isInteger(value.id) || typeof value.username !== 'string' || !isAdminRole(value.role) || !isAccountStatus(value.status) || !(value.phone === null || typeof value.phone === 'string')) throw new Error('服务器返回的管理员会话数据格式无效。')
  return { id: value.id, username: value.username, phone: value.phone, role: value.role, status: value.status }
}
export function parseAdminSession(value: unknown): AdminSession {
  if (!isRecord(value) || typeof value.accessToken !== 'string' || typeof value.expiresIn !== 'number' || !Number.isFinite(value.expiresIn)) throw new Error('服务器返回的登录凭据格式无效。')
  return { accessToken: value.accessToken, expiresIn: value.expiresIn, admin: parseAdminProfile(value.admin) }
}
async function unwrapSession(response: Promise<{ data: ApiEnvelope<unknown> }>): Promise<AdminSession> { const { data } = await response; return parseAdminSession(data.data) }
export const adminAuthApi = {
  login(input: AdminLoginInput): Promise<AdminSession> { return unwrapSession(request.post<ApiEnvelope<unknown>>('/api/v2/auth/admin/login', input, { skipAuthRefresh: true })) },
  refresh(): Promise<AdminSession> { return unwrapSession(request.post<ApiEnvelope<unknown>>('/api/v2/auth/admin/refresh', undefined, { skipAuthRefresh: true })) },
  async logout(): Promise<void> { await request.post('/api/v2/auth/admin/logout', undefined, { skipAuthRefresh: true }) },
}
export function getAdminFacingError(error: unknown): string { const response = (error as AxiosError<ApiErrorPayload>).response; if (typeof response?.data?.message === 'string') return response.data.message; if ((error as AxiosError).code === 'ECONNABORTED') return '请求超时，请稍后重试。'; if ((error as AxiosError).request) return '网络连接异常，请检查网络后重试。'; return error instanceof Error ? error.message : '操作未完成，请稍后重试。' }
