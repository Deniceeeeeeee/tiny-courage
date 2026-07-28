import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { Person } from '../types'

interface Props {
  person: Person | null
  eventName: string
  onSave: (id: string, name: string, note: string) => void
  onClose: () => void
}

function ordinal(value: number) {
  const suffix = value % 10 === 1 && value % 100 !== 11 ? 'st' : value % 10 === 2 && value % 100 !== 12 ? 'nd' : value % 10 === 3 && value % 100 !== 13 ? 'rd' : 'th'
  return `${value}${suffix}`
}

export default function CharacterDetails({ person, eventName, onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  useEffect(() => {
    setName(person?.name ?? '')
    setNote(person?.note ?? '')
  }, [person])
  if (!person) return null

  return (
    <div className="profile-wrap">
      <section className="profile-card" aria-label={`${person.name} details`}>
        <button className="modal-close" onClick={onClose} aria-label="Close character details"><X /></button>
        <div className="profile-avatar" aria-hidden="true"><span /></div>
        <p className="eyebrow">Conversation #{person.order}</p>
        <label>Name
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <dl>
          <dt>Met at</dt><dd>{eventName}</dd>
          <dt>Moment</dt><dd>Your {ordinal(person.order)} conversation</dd>
        </dl>
        <label>Talked about
          <textarea rows={3} value={note} placeholder="No note yet" onChange={(event) => setNote(event.target.value)} />
        </label>
        <button className="small-primary" onClick={() => onSave(person.id, name.trim() || person.name, note.trim())}>Save changes</button>
      </section>
    </div>
  )
}
