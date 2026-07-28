import { Award } from 'lucide-react'
import Confetti from './Confetti'

interface Props {
  count: number
  onContinue: () => void
}

export default function GoalCelebration({ count, onContinue }: Props) {
  return (
    <div className="celebration-backdrop">
      <Confetti large />
      <section className="goal-celebration" role="dialog" aria-modal="true" aria-labelledby="goal-title">
        <div className="achievement"><Award size={27} /></div>
        <p className="eyebrow">You showed up</p>
        <h2 id="goal-title">Courage Goal<br />Completed</h2>
        <p className="celebration-count"><strong>{count} conversations.</strong><br />{count} moments of courage.</p>
        <div className="badge"><span>Achievement</span><strong>I Showed Up</strong></div>
        <button className="primary-button" onClick={onContinue}>Keep My Crowd Growing <span>→</span></button>
      </section>
    </div>
  )
}
