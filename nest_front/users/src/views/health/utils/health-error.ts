import { getUserFacingError } from '../../../app/auth'

export function getHealthUserFacingError(error: unknown, unavailableMessage: string): string {
  const status = (error as { response?: { status?: unknown } }).response?.status
  return status === 503 ? unavailableMessage : getUserFacingError(error)
}
