export const TOUCH_THRESHOLD_RATIO = 0.18
export const RELEASE_THRESHOLD_RATIO = 0.25
export const FINGERTIP_IDS = [8, 12, 16, 20] as const
export type FingerName = 'index' | 'middle' | 'ring' | 'little'
export const FINGER_NAMES: FingerName[] = ['index', 'middle', 'ring', 'little']

export interface Point3D { x: number; y: number; z?: number }
export type TouchState = Record<FingerName, boolean>

const distance = (a: Point3D, b: Point3D) =>
  Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0))

export function getPalmWidth(landmarks: Point3D[]): number {
  return distance(landmarks[5], landmarks[17])
}

export interface GestureResult {
  triggered: FingerName | null
  nextState: TouchState
  distances: Record<FingerName, number>
  threshold: number
}

export function detectThumbTouch(
  landmarks: Point3D[],
  previous: TouchState,
): GestureResult {
  const palmWidth = getPalmWidth(landmarks)
  const threshold = palmWidth * TOUCH_THRESHOLD_RATIO
  const releaseThreshold = palmWidth * RELEASE_THRESHOLD_RATIO
  const thumb = landmarks[4]
  const nextState = { ...previous }
  const distances = {} as Record<FingerName, number>
  let triggered: FingerName | null = null

  FINGERTIP_IDS.forEach((id, index) => {
    const finger = FINGER_NAMES[index]
    const gap = distance(thumb, landmarks[id])
    distances[finger] = gap
    if (previous[finger]) {
      nextState[finger] = gap < releaseThreshold
    } else {
      nextState[finger] = gap < threshold
      if (nextState[finger] && triggered === null) triggered = finger
    }
  })

  return { triggered, nextState, distances, threshold }
}

export const EMPTY_TOUCH_STATE: TouchState = {
  index: false,
  middle: false,
  ring: false,
  little: false,
}
