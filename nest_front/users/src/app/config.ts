const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

function parseApiBaseUrl(value: string): string {
  try {
    return new URL(value).toString().replace(/\/$/, '')
  } catch {
    throw new Error('VITE_API_BASE_URL 必须是有效的 HTTP(S) 地址。')
  }
}

export const appConfig = {
  apiBaseUrl: parseApiBaseUrl(configuredApiBaseUrl),
} as const
