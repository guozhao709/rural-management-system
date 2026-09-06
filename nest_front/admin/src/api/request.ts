import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { appConfig } from '../app/config'
declare module 'axios' { export interface AxiosRequestConfig { skipAuthRefresh?: boolean; _authRetried?: boolean } }
interface RequestAuthHandlers { getAccessToken: () => string | null; refresh: () => Promise<boolean>; onUnauthenticated: () => void }
let authHandlers: RequestAuthHandlers | undefined
export function configureRequestAuth(handlers: RequestAuthHandlers): void { authHandlers = handlers }
export const request = axios.create({ baseURL: appConfig.apiBaseUrl, withCredentials: true, timeout: 10_000 })
request.interceptors.request.use((config: InternalAxiosRequestConfig) => { const token = authHandlers?.getAccessToken(); if (token && !config.skipAuthRefresh) config.headers.set('Authorization', `Bearer ${token}`); return config })
request.interceptors.response.use(response => response, async (error: AxiosError) => {
  const originalRequest = error.config
  if (error.response?.status !== 401 || !originalRequest || originalRequest.skipAuthRefresh || originalRequest._authRetried || !authHandlers?.getAccessToken() || !authHandlers) return Promise.reject(error)
  originalRequest._authRetried = true
  if (!await authHandlers.refresh()) { authHandlers.onUnauthenticated(); return Promise.reject(error) }
  return request(originalRequest)
})
