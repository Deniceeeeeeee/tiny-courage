import { useEffect, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'

interface Props {
  open: boolean
  onConfirm: (name: string, note: string, photo?: string) => void
  onCancel: () => void
}

function resizePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(url)
      const maxSize = 720
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Unable to prepare photo'))
        return
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', .78))
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Unable to read photo'))
    }
    image.src = url
  })
}

export default function PersonModal({ open, onConfirm, onCancel }: Props) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<string | undefined>()
  const [photoError, setPhotoError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName('')
      setNote('')
      setPhoto(undefined)
      setPhotoError('')
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
        <form onSubmit={(event) => { event.preventDefault(); onConfirm(name.trim(), note.trim(), photo) }}>
          <label>Person’s name <span>optional</span>
            <input ref={inputRef} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Alex" maxLength={60} />
          </label>
          <label>What did you talk about? <span>optional</span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="A project, a shared interest…" maxLength={240} rows={3} />
          </label>
          <div className="photo-field">
            <span>Take a photo <em>optional</em></span>
            {photo && <img src={photo} alt="Selected person" />}
            <div className="photo-actions">
              <label className="photo-button">
                <Camera size={17} /> {photo ? 'Change Photo' : 'Take Photo'}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    setPhotoError('')
                    void resizePhoto(file)
                      .then(setPhoto)
                      .catch(() => setPhotoError('Could not add that photo. Try another one.'))
                    event.target.value = ''
                  }}
                />
              </label>
              {photo && <button className="text-button photo-remove" type="button" onClick={() => setPhoto(undefined)}>Remove</button>}
            </div>
            {photoError && <p className="photo-error">{photoError}</p>}
          </div>
          <button className="primary-button" type="submit">Add to My Crowd <span>→</span></button>
          <button className="text-button" type="button" onClick={() => onConfirm('', note.trim(), photo)}>Skip Name</button>
        </form>
      </section>
    </div>
  )
}
