import { describe, expect, it } from 'vitest'
import { detectThumbTouch, EMPTY_TOUCH_STATE, type Point3D } from './handGestureDetection'

function hand(touchIds: number[] = [], scale = 1): Point3D[] {
  const points = Array.from({ length: 21 }, (_, i) => ({
    x: (i % 5) * 0.08 * scale,
    y: Math.floor(i / 5) * 0.08 * scale,
    z: 0,
  }))
  points[4] = { x: 0.2 * scale, y: 0.1 * scale, z: 0 }
  points[5] = { x: 0.1 * scale, y: 0.3 * scale, z: 0 }
  points[17] = { x: 0.5 * scale, y: 0.3 * scale, z: 0 }
  ;[8, 12, 16, 20].forEach((id, i) => {
    points[id] = touchIds.includes(id)
      ? { x: 0.21 * scale, y: 0.1 * scale, z: 0 }
      : { x: (0.4 + i * 0.08) * scale, y: 0.05 * scale, z: 0 }
  })
  return points
}

describe('thumb touch gesture', () => {
  ;[
    [8, 'index'], [12, 'middle'], [16, 'ring'], [20, 'little'],
  ].forEach(([id, name]) => {
    it(`detects ${name} exactly on transition`, () => {
      const first = detectThumbTouch(hand([id as number]), EMPTY_TOUCH_STATE)
      expect(first.triggered).toBe(name)
      const held = detectThumbTouch(hand([id as number]), first.nextState)
      expect(held.triggered).toBeNull()
    })
  })

  it('requires separation before another touch', () => {
    const first = detectThumbTouch(hand([8]), EMPTY_TOUCH_STATE)
    const apart = detectThumbTouch(hand(), first.nextState)
    const again = detectThumbTouch(hand([8]), apart.nextState)
    expect(again.triggered).toBe('index')
  })

  it('chooses only one trigger when two fingertips approach', () => {
    expect(detectThumbTouch(hand([8, 12]), EMPTY_TOUCH_STATE).triggered).toBe('index')
  })

  it('normalises threshold when hand scale changes', () => {
    expect(detectThumbTouch(hand([16], 0.5), EMPTY_TOUCH_STATE).triggered).toBe('ring')
    expect(detectThumbTouch(hand([16], 2), EMPTY_TOUCH_STATE).triggered).toBe('ring')
  })
})
