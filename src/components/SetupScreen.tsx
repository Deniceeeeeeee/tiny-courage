import { useState } from 'react'
import { Pencil, Trash2, Users } from 'lucide-react'
import type { EventSession } from '../types'

interface Props {
  onStart: (eventName: string, goal: number) => void
  savedEvents: EventSession[]
  onEdit: (session: EventSession) => void
  onDelete: (session: EventSession) => void
}

function TinyFigure() {
  return (
    <svg className="setup-figure" viewBox="0 0 180 180" aria-hidden="true">
      <circle cx="90" cy="42" r="22" />
      <path d="M90 65v58M90 78 56 103M90 78l35 22M90 122l-25 40M90 122l28 40" />
      <path className="hello-lines" d="m128 48 18-8m-14 22 22 1m-27-30 10-16" />
    </svg>
  )
}

export default function SetupScreen({ onStart, savedEvents, onEdit, onDelete }: Props) {
  const [eventName, setEventName] = useState('')
  const [goal, setGoal] = useState(10)

  return (
    <main className="center-screen setup-screen">
      <div className="brand-mark">tiny steps, real courage</div>
      <section className="setup-copy">
        <div>
          <p className="eyebrow">A little world for every hello</p>
          <h1>Tiny<br />Courage<span>.</span></h1>
          <p className="tagline">Every hello brings someone into your little world.</p>
        </div>
        <TinyFigure />
      </section>

      <form
        className="setup-card"
        onSubmit={(event) => {
          event.preventDefault()
          if (eventName.trim()) onStart(eventName.trim(), goal)
        }}
      >
        <label>
          What are you showing up for?
          <input
            value={eventName}
            onChange={(event) => setEventName(event.target.value)}
            placeholder="e.g. Community Design Night"
            maxLength={80}
            required
            autoFocus
          />
        </label>
        <div className="goal-label">
          <label htmlFor="courage-goal">How many hellos feel brave today?</label>
          <output htmlFor="courage-goal">{goal}</output>
        </div>
        <input
          id="courage-goal"
          className="range"
          type="range"
          min="1"
          max="100"
          value={goal}
          onChange={(event) => setGoal(Number(event.target.value))}
          aria-label="Courage goal"
        />
        <div className="range-ends"><span>1</span><span>100</span></div>
        <button className="primary-button" type="submit">Start My Courage Goal <span>→</span></button>
      </form>
      {savedEvents.length > 0 && (
        <section className="saved-events" aria-labelledby="saved-events-title">
          <div className="saved-events-heading">
            <div>
              <p className="eyebrow">Your courage archive</p>
              <h2 id="saved-events-title">Saved events</h2>
            </div>
            <span>{savedEvents.length}</span>
          </div>
          <div className="saved-events-list">
            {savedEvents.map((saved) => (
              <article className="saved-event-card" key={saved.id}>
                <div className="saved-event-copy">
                  <h3>{saved.eventName}</h3>
                  <p><Users size={14} /> {saved.people.length} {saved.people.length === 1 ? 'person' : 'people'} · Goal {saved.goal}</p>
                  <time dateTime={new Date(saved.startedAt).toISOString()}>
                    {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(saved.startedAt)}
                  </time>
                </div>
                <div className="saved-event-actions">
                  <button className="edit-event-button" type="button" onClick={() => onEdit(saved)}>
                    <Pencil size={16} /> Edit & Add Friends
                  </button>
                  <button className="delete-event-button" type="button" onClick={() => onDelete(saved)} aria-label={`Delete ${saved.eventName}`}>
                    <Trash2 size={17} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      <p className="privacy-note">Guest mode available · Sign in to sync</p>
    </main>
  )
}
