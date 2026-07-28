import { describe, expect, it } from 'vitest'
import { classifyCameraFailure } from './camera'

describe('camera failure handling', () => {
  it('routes denied permission to a clear retry state', () => {
    expect(classifyCameraFailure(new DOMException('blocked', 'NotAllowedError'))).toBe('denied')
  })

  it('routes missing or busy cameras to manual fallback', () => {
    expect(classifyCameraFailure(new DOMException('missing', 'NotFoundError'))).toBe('unavailable')
    expect(classifyCameraFailure(new DOMException('busy', 'NotReadableError'))).toBe('unavailable')
  })
})
