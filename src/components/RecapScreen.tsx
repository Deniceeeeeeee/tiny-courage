import { ArrowLeft, Download, Sparkles } from 'lucide-react'
import type { Person } from '../types'
import StickWorld, { drawStickPerson } from './StickWorld'
import backpackUrl from '../../backpack.png'
import capUrl from '../../cap.png'
import coffeeUrl from '../../coffee-cup.png'
import glassesUrl from '../../glasses.png'

interface Props {
  eventName: string
  goal: number
  people: Person[]
  onReturn: () => void
  onNew: () => void
}

const imageSources = { cap: capUrl, glasses: glassesUrl, backpack: backpackUrl, coffee: coffeeUrl }

async function downloadRecap(eventName: string, goal: number, people: Person[]) {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 1200
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.fillStyle = '#f7f1e4'
  ctx.fillRect(0, 0, 1200, 1200)
  ctx.fillStyle = '#ffd85f'
  ctx.beginPath(); ctx.arc(1050, 120, 170, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#171510'
  ctx.font = '800 40px system-ui'
  ctx.fillText('TINY COURAGE', 90, 110)
  ctx.font = '800 82px system-ui'
  ctx.fillText(eventName, 90, 220, 900)
  ctx.font = '500 30px system-ui'
  ctx.fillText('You arrived with an empty screen. You left with a crowd.', 90, 285)
  ctx.font = '800 42px system-ui'
  ctx.fillText(`Today’s Courage  ${people.length} / ${goal}`, 90, 365)
  ctx.strokeStyle = '#d2c5ac'
  ctx.lineWidth = 4
  ctx.beginPath(); ctx.moveTo(90, 1010); ctx.bezierCurveTo(400, 980, 780, 1030, 1110, 990); ctx.stroke()

  const images: Record<string, HTMLImageElement> = {}
  await Promise.all(Object.entries(imageSources).map(([name, src]) => new Promise<void>((resolve) => {
    const image = new Image()
    image.onload = () => { images[name] = image; resolve() }
    image.onerror = () => resolve()
    image.src = src
  })))
  const cols = Math.min(8, Math.max(3, Math.ceil(Math.sqrt(people.length * 1.8))))
  people.forEach((person, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    const x = 145 + col * (920 / Math.max(cols - 1, 1)) + (row % 2) * 18
    const y = 540 + row * 145
    drawStickPerson(ctx, x, Math.min(980, y), 1.2, index % 3 === 0 ? 'waving' : 'standing', index % 2 ? 1 : -1, index, person.accessory, images)
    ctx.font = '600 18px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText(person.name, x, Math.min(1022, y + 35))
  })
  ctx.textAlign = 'left'
  ctx.font = '700 25px system-ui'
  ctx.fillText(people.length >= goal ? 'GOAL REACHED · I SHOWED UP' : 'EVERY HELLO COUNTED', 90, 1120)
  const link = document.createElement('a')
  link.download = `tiny-courage-${eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

export default function RecapScreen({ eventName, goal, people, onReturn, onNew }: Props) {
  return (
    <main className="recap-screen">
      <header className="recap-nav">
        <button className="text-button" onClick={onReturn}><ArrowLeft size={18} /> Return to Event</button>
        <span className="wordmark">Tiny Courage<span>.</span></span>
      </header>
      <section className="recap-hero">
        <div className="recap-spark"><Sparkles /></div>
        <p className="eyebrow">Event complete</p>
        <h1>You arrived with an empty screen.<br /><em>You left with a crowd.</em></h1>
        <p>{eventName}</p>
        <div className="recap-score"><strong>{people.length}</strong><span>Today’s Courage<br />Original goal: {goal} · {people.length >= goal ? 'Reached' : 'Every hello mattered'}</span></div>
      </section>
      <StickWorld people={people} calm />
      <section className="people-list">
        <div className="section-heading"><p className="eyebrow">The people you met</p><span>{people.length} conversations</span></div>
        {people.length ? people.map((person) => (
          <article key={person.id}>
            <span className="list-number">{String(person.order).padStart(2, '0')}</span>
            <div><strong>{person.name}</strong><p>{person.note || 'A small moment of courage.'}</p></div>
          </article>
        )) : <p className="empty-list">Your crowd is still waiting for its first hello.</p>}
      </section>
      <div className="recap-actions">
        <button className="primary-button" onClick={() => void downloadRecap(eventName, goal, people)}><Download size={20} /> Download Recap</button>
        <button className="secondary-button" onClick={onNew}>Start New Event</button>
      </div>
    </main>
  )
}
