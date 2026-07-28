import { useEffect, useState } from 'react'
import { Camera, X } from 'lucide-react'
import type { Person } from '../types'

interface Props {
  person: Person | null
  eventName: string
  onSave: (id: string, name: string, note: string, photo?: string) => void
  onClose: () => void
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

function ordinal(value: number) {
  const suffix = value % 10 === 1 && value % 100 !== 11 ? 'st' : value % 10 === 2 && value % 100 !== 12 ? 'nd' : value % 10 === 3 && value % 100 !== 13 ? 'rd' : 'th'
  return `${value}${suffix}`
}

export default function CharacterDetails({ person, eventName, onSave, onClose }: Props) {
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState<string | undefined>()
  const [photoError, setPhotoError] = useState('')
  useEffect(() => {
    setName(person?.name ?? '')
    setNote(person?.note ?? '')
    setPhoto(person?.photo)
    setPhotoError('')
  }, [person])
  if (!person) return null

  return (
    <div className="profile-wrap">
      <section className="profile-card" aria-label={`${person.name} details`}>
        <button className="modal-close" onClick={onClose} aria-label="Close character details"><X /></button>
        {photo ? <img className="profile-photo" src={photo} alt={person.name} /> : <div className="profile-avatar" aria-hidden="true"><span /></div>}
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
        <div className="photo-field profile-photo-field">
          <span>Photo <em>optional</em></span>
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
        <button className="small-primary" onClick={() => onSave(person.id, name.trim() || person.name, note.trim(), photo)}>Save changes</button>
      </section>
    </div>
  )
}
