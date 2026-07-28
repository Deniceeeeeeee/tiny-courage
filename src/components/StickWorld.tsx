import { useEffect, useMemo, useRef } from 'react'
import type { AnimationState, Person } from '../types'

const parachuteUrl = "/coverage/parachute.png";

interface RuntimePerson {
  x: number
  direction: -1 | 1
  state: AnimationState
  stateUntil: number
  companion?: string
}

interface Props {
  people: Person[]
  selectedId?: string | null
  celebration?: boolean
  calm?: boolean
  pendingPerson?: Person | null
  freezePending?: boolean
  departing?: { person: Person; since: number } | null
  onSelect?: (person: Person) => void
}

const actionWeights: Array<{ state: AnimationState; weight: number }> = [
  { state: 'standing', weight: 28 },
  { state: 'walking', weight: 28 },
  { state: 'waving', weight: 11 },
  { state: 'sitting', weight: 10 },
  { state: 'looking', weight: 9 },
  { state: 'cheering', weight: 8 },
  { state: 'lying', weight: 6 },
]
const totalActionWeight = actionWeights.reduce((sum, action) => sum + action.weight, 0)

function pickAction(seed: number): AnimationState {
  let cursor = seed * totalActionWeight
  for (const action of actionWeights) {
    cursor -= action.weight
    if (cursor <= 0) return action.state
  }
  return 'standing'
}

function actionDuration(state: AnimationState, seed: number) {
  const base = state === 'standing' || state === 'walking' ? 3200 : 2400
  const range = state === 'standing' || state === 'walking' ? 3200 : 2200
  return base + seed * range
}

function loadImage(src: string) {
  const image = new Image()
  image.src = src
  return image
}

function seeded(index: number, salt = 0) {
  const value = Math.sin(index * 917.31 + salt * 41.7) * 10000
  return value - Math.floor(value)
}

// Shared with the recap exporter so the downloaded crowd matches the live world.
// eslint-disable-next-line react-refresh/only-export-components
export function drawStickPerson(
  ctx: CanvasRenderingContext2D,
  x: number,
  ground: number,
  scale: number,
  state: AnimationState,
  direction: -1 | 1,
  phase: number,
  alpha = 1,
) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(x, ground)
  ctx.scale(direction * scale, scale)
  ctx.strokeStyle = '#171510'
  ctx.lineWidth = 4.4
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const walking = state === 'walking'
  const waving = state === 'waving' || state === 'cheering' || state === 'highfive'
  const sitting = state === 'sitting'
  const lying = state === 'lying'
  if (sitting) {
    const breathe = Math.sin(phase * 2) * 1.5
    ctx.translate(0, breathe)

    ctx.beginPath()
    ctx.arc(0, -43, 10.5, 0, Math.PI * 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, -32)
    ctx.quadraticCurveTo(1, -21, 0, -11)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, -26)
    ctx.quadraticCurveTo(-12, -18, -19, -8)
    ctx.moveTo(0, -26)
    ctx.quadraticCurveTo(12, -18, 19, -8)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, -11)
    ctx.quadraticCurveTo(-14, -2, -28, 0)
    ctx.lineTo(-38, 0)
    ctx.moveTo(0, -11)
    ctx.quadraticCurveTo(13, -3, 25, 1)
    ctx.lineTo(39, 1)
    ctx.stroke()

    ctx.restore()
    return
  }
  if (lying) {
    ctx.beginPath()
    ctx.arc(-30, -11, 10.5, 0, Math.PI * 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(-19, -9)
    ctx.quadraticCurveTo(2, -13, 24, -8)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(-2, -10)
    ctx.quadraticCurveTo(-4, -22, -14, -26)
    ctx.moveTo(0, -10)
    ctx.quadraticCurveTo(8, 0, 20, -1)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(23, -8)
    ctx.quadraticCurveTo(35, -15, 46, -13)
    ctx.moveTo(23, -8)
    ctx.quadraticCurveTo(35, -1, 47, 0)
    ctx.stroke()

    ctx.restore()
    return
  }
  const jump = state === 'cheering' ? Math.abs(Math.sin(phase * 2.8)) * 9 : 0
  const bob = walking ? Math.abs(Math.sin(phase * 5)) * 2 : 0
  ctx.translate(0, -jump - bob)

  const headY = -58
  ctx.beginPath()
  ctx.arc(0, headY, 10.5, 0, Math.PI * 2)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(0, -47)
  ctx.quadraticCurveTo(1, -31, 0, -14)
  ctx.stroke()

  const armSwing = walking ? Math.sin(phase * 5) * 13 : 0
  ctx.beginPath()
  ctx.moveTo(0, -41)
  if (waving) {
    ctx.quadraticCurveTo(-10, -53, -17, -65 + Math.sin(phase * 7) * 3)
    ctx.moveTo(0, -40)
    ctx.quadraticCurveTo(13, -52, 18, -64 - Math.sin(phase * 7) * 3)
  } else if (state === 'looking') {
    ctx.quadraticCurveTo(-11, -40, -18, -34)
    ctx.moveTo(0, -40)
    ctx.quadraticCurveTo(9, -50, 13, -60)
  } else {
    ctx.quadraticCurveTo(-10, -34 + armSwing * .4, -17, -25 + armSwing)
    ctx.moveTo(0, -40)
    ctx.quadraticCurveTo(10, -34 - armSwing * .4, 17, -25 - armSwing)
  }
  ctx.stroke()

  ctx.beginPath()
  const leg = walking ? Math.sin(phase * 5) * 12 : 0
  ctx.moveTo(0, -14); ctx.quadraticCurveTo(-8, 2, -11 - leg, 15)
  ctx.moveTo(0, -14); ctx.quadraticCurveTo(8, 2, 11 + leg, 15)
  ctx.stroke()

  ctx.restore()
}

export default function StickWorld({
  people,
  selectedId,
  celebration = false,
  calm = false,
  pendingPerson = null,
  freezePending = false,
  departing = null,
  onSelect,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const runtime = useRef(new Map<string, RuntimePerson>())
  const frameRef = useRef(0)
  const images = useMemo(() => ({
    parachute: loadImage(parachuteUrl),
  }), [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let previous = performance.now()

    const render = (now: number) => {
      const rect = canvas.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      if (canvas.width !== Math.round(rect.width * ratio) || canvas.height !== Math.round(rect.height * ratio)) {
        canvas.width = Math.round(rect.width * ratio)
        canvas.height = Math.round(rect.height * ratio)
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      const width = rect.width
      const height = rect.height
      const ground = height - 34
      const dt = Math.min(32, now - previous)
      previous = now
      ctx.clearRect(0, 0, width, height)

      ctx.strokeStyle = '#d7cdb8'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(16, ground + 17)
      ctx.bezierCurveTo(width * .28, ground + 8, width * .65, ground + 23, width - 16, ground + 13)
      ctx.stroke()
      ctx.fillStyle = 'rgba(255,216,95,.17)'
      ctx.beginPath(); ctx.ellipse(width * .72, height * .22, 54, 22, -.2, 0, Math.PI * 2); ctx.fill()

      const visiblePeople = [
        ...people,
        ...(pendingPerson ? [pendingPerson] : []),
        ...(departing ? [departing.person] : []),
      ]

      visiblePeople.forEach((person, index) => {
        let live = runtime.current.get(person.id)
        if (!live) {
          live = { x: person.x * width, direction: person.direction, state: person.state, stateUntil: now + 2200 + seeded(index, 4) * 4000 }
          runtime.current.set(person.id, live)
        }
        const isPending = pendingPerson?.id === person.id
        const isDeparting = departing?.person.id === person.id
        const age = isPending && freezePending ? 1200 : Date.now() - person.createdAt
        const arriving = age < 3900 && !reduced
        let y = ground
        let alpha = 1

        if (celebration) {
          const columns = Math.max(3, Math.ceil(Math.sqrt(people.length)))
          const targetX = width / 2 + ((index % columns) - (columns - 1) / 2) * Math.min(49, width / (columns + 1))
          live.x += (targetX - live.x) * .035
          live.state = index % 2 ? 'waving' : 'cheering'
        } else if (!calm && person.id !== selectedId && !arriving) {
          if (now > live.stateUntil) {
            live.state = pickAction(seeded(index, Math.floor(now / 4000)))
            live.stateUntil = now + actionDuration(live.state, seeded(index, Math.floor(now / 7000)))
            live.direction = seeded(index, Math.floor(now / 9000)) > .5 ? 1 : -1
            const nearby = people.find((candidate, otherIndex) => {
              if (candidate.id === person.id || otherIndex < index) return false
              const other = runtime.current.get(candidate.id)
              return other && Math.abs(other.x - live.x) < 84
            })
            if (nearby && seeded(index, Math.floor(now / 11000)) < .32) {
              const other = runtime.current.get(nearby.id)
              live.state = seeded(index, 8) > .5 ? 'highfive' : 'talking'
              live.stateUntil = now + 2800
              if (other) {
                other.state = live.state
                other.stateUntil = live.stateUntil
                other.direction = live.x < other.x ? -1 : 1
                live.direction = live.x < other.x ? 1 : -1
              }
            }
          }
          if (live.state === 'walking') {
            live.x += live.direction * person.speed * dt * .028
            if (live.x < 28 || live.x > width - 28) live.direction = live.direction === 1 ? -1 : 1
            live.x = Math.max(28, Math.min(width - 28, live.x))
          }
        } else if (person.id === selectedId) {
          live.state = 'standing'
        }

        if (arriving || isDeparting) {
          const departureProgress = isDeparting ? Math.min(1, (Date.now() - departing.since) / 700) : 0
          const progress = isDeparting ? .4 - departureProgress * .22 : Math.min(1, age / 3000)
          const sway = Math.sin(age / 330) * 13
          y = -5 + progress * (ground + 5)
          alpha = isDeparting ? 1 - departureProgress : 1
          live.x = Math.max(38, Math.min(width - 38, person.x * width + sway))
          if (images.parachute.complete) {
            const opacity = isDeparting ? alpha : age > 3200 ? 1 - (age - 3200) / 700 : 1
            ctx.globalAlpha = Math.max(0, opacity)
            ctx.drawImage(images.parachute, live.x - 42, y - 120, 84, 84)
            ctx.globalAlpha = 1
          }
        }

        const state = arriving ? (age > 3200 ? 'waving' : 'standing') : live.state
        drawStickPerson(ctx, live.x, y, .72, state, live.direction, now / 1000 + index, isDeparting ? alpha : arriving ? Math.min(1, age / 450) : 1)
        if (!arriving && !isDeparting && (state === 'standing' || state === 'talking')) {
          ctx.fillStyle = 'rgba(247,241,228,.9)'
          ctx.font = '600 10px system-ui'
          ctx.textAlign = 'center'
          const label = person.name.length > 14 ? `${person.name.slice(0, 13)}…` : person.name
          ctx.fillText(label, live.x, ground + 28)
        }
      })
      frameRef.current = requestAnimationFrame(render)
    }
    frameRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frameRef.current)
  }, [calm, celebration, departing, freezePending, images, pendingPerson, people, selectedId])

  return (
    <section className="world-card">
      <div className="world-title">
        <div><p className="eyebrow">Your little world</p><h2>{people.length ? `${people.length} ${people.length === 1 ? 'person' : 'people'} here` : 'Ready for its first hello'}</h2></div>
        <span>tap someone to remember</span>
      </div>
      <canvas
        ref={canvasRef}
        className="world-canvas"
        aria-label={`Animated crowd with ${people.length} ${people.length === 1 ? 'person' : 'people'}`}
        onClick={(event) => {
          if (!onSelect || !people.length) return
          const rect = event.currentTarget.getBoundingClientRect()
          const x = event.clientX - rect.left
          const y = event.clientY - rect.top
          const ground = rect.height - 34
          let nearest: Person | null = null
          let nearestDistance = Number.POSITIVE_INFINITY
          people.forEach((person) => {
            const live = runtime.current.get(person.id)
            const personX = live?.x ?? person.x * rect.width
            const personState = live?.state ?? person.state
            const isLying = personState === 'lying'
            const isSitting = personState === 'sitting'
            const left = personX - (isLying || isSitting ? 42 : 22)
            const right = personX + (isLying || isSitting ? 42 : 22)
            const top = ground - (isLying ? 28 : isSitting ? 56 : 66)
            const bottom = ground + (isLying ? 8 : isSitting ? 8 : 16)
            if (x < left || x > right || y < top || y > bottom) return
            const distanceFromCenter = Math.hypot(x - personX, y - (top + bottom) / 2)
            if (distanceFromCenter < nearestDistance) {
              nearestDistance = distanceFromCenter
              nearest = person
            }
          })
          if (nearest) onSelect(nearest)
        }}
      />
      {!people.length && <div className="empty-world"><span>☀</span><p>Your first new friend<br />will land right here.</p></div>}
    </section>
  )
}
