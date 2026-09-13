import { describe, expect, it } from 'vitest'
import { getHealthUserFacingError } from './health-error'

describe('getHealthUserFacingError', () => {
  it('uses the required fail-safe assessment message for HTTP 503', () => {
    expect(
      getHealthUserFacingError({ response: { status: 503 } }, '暂时无法评估，请稍后再试。'),
    ).toBe('暂时无法评估，请稍后再试。')
  })
})
