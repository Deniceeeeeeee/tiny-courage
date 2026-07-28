export type CameraFailure = 'denied' | 'unavailable'

export function classifyCameraFailure(error: unknown): CameraFailure {
  if (error instanceof DOMException && (error.name === 'NotFoundError' || error.name === 'NotReadableError')) {
    return 'unavailable'
  }
  return 'denied'
}
