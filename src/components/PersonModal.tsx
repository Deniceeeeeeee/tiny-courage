import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onConfirm: (name: string, note: string) => void
  onCancel: () => void
}

export default function PersonModal({ open, onConfirm, onCancel }: Props) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setNote('')
      window.setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open])

  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <section className="person-modal" role="dialog" aria-modal="true" aria-labelledby="person-modal-title">
        <button className="modal-close" onClick={onCancel} aria-label="Cancel adding person"><X /></button>
        <div className="modal-face" aria-hidden="true">◡</div>
        <p className="eyebrow">+1 Courage</p>
        <h2 id="person-modal-title">Who did you meet?</h2>
        <p>You did the brave bit. Add a detail if you’d like.</p>
        <form onSubmit={(event) => { event.preventDefault(); onConfirm(name.trim(), note.trim()) }}>
          <label>Person’s name <span>optional</span>
            <input ref={inputRef} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex" maxLength={60} />
          </label>
          <label>What did you talk about? <span>optional</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="A project, a shared interest…" maxLength={240} rows={3} />
          </label>
          <button className="primary-button" type="submit">Add to My Crowd <span>→</span></button>
          <button className="text-button" type="button" onClick={() => onConfirm('', note.trim())}>Skip Name</button>
        </form>
      </section>
    </div>
  )
}
