import { RotateCcw } from 'lucide-react'

interface Props {
  eventName: string
  count: number
  goal: number
  onReset: () => void
}

export default function CourageHeader({ eventName, count, goal, onReset }: Props) {
  const percent = Math.min(100, (count / goal) * 100)
  return (
    <header className="courage-header">
      <div className="header-top">
        <div>
          <p className="event-label">AT · {eventName.toUpperCase()}</p>
          <h1>Today’s Courage</h1>
        </div>
        <button className="icon-button" onClick={onReset} aria-label="Reset event"><RotateCcw size={19} /></button>
      </div>
      <div className="progress-copy">
        <strong>{count} <span>/ {goal}</span></strong>
        <span>{count >= goal ? 'Goal met — keep going!' : `${goal - count} ${goal - count === 1 ? 'hello' : 'hellos'} to go`}</span>
      </div>
      <div className="progress-track" role="progressbar" aria-label="Today’s Courage progress" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={count}>
        <div className="progress-fill" style={{ width: `${percent}%` }}>
          {percent > 7 && <i />}
        </div>
      </div>
    </header>
  )
}
