import { useCallback, useEffect, useRef, useState } from 'react'
import { Flag, Plus } from 'lucide-react'
import SetupScreen from './components/SetupScreen'
import CameraPermission from './components/CameraPermission'
import CourageHeader from './components/CourageHeader'
import GestureCamera from './components/GestureCamera'
import PersonModal from './components/PersonModal'
import StickWorld from './components/StickWorld'
import CharacterDetails from './components/CharacterDetails'
import GoalCelebration from './components/GoalCelebration'
import RecapScreen from './components/RecapScreen'
import Confetti from './components/Confetti'
import { deactivateSession, deleteSession, loadSession, loadSessions, saveSession } from './utils/storage'
import { classifyCameraFailure } from './utils/camera'
import type { Accessory, AppScreen, EventSession, Person } from './types'

const accessoryOptions: Accessory[] = ['none']

function milestone(count: number, goal: number) {
  if (count === 1) return 'The first hello is always the hardest.'
  if (count === Math.ceil(goal / 2)) return 'You’re halfway there. Your little crowd is growing.'
  if (count === goal - 1) return 'Just one more courageous hello.'
  return ''
}

export default function App() {
  const restored = useRef(loadSession())
  const [session, setSession] = useState<EventSession | null>(restored.current)
  const [savedEvents, setSavedEvents] = useState<EventSession[]>(() => loadSessions())
  const [screen, setScreen] = useState<AppScreen>(restored.current ? 'event' : 'setup')
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'requesting' | 'denied' | 'unavailable'>('idle')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [personModal, setPersonModal] = useState(false)
  const [additionSource, setAdditionSource] = useState<'gesture' | 'manual'>('manual')
  const [pendingPerson, setPendingPerson] = useState<Person | null>(null)
  const [departing, setDeparting] = useState<{ person: Person; since: number } | null>(null)
  const [selected, setSelected] = useState<Person | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [banner, setBanner] = useState('')
  const [arrivalMessage, setArrivalMessage] = useState('')
  const [smallConfetti, setSmallConfetti] = useState(false)
  const pendingModalTimer = useRef<number | null>(null)

  useEffect(() => {
    if (session) {
      const updated = { ...session, updatedAt: Date.now() }
      saveSession(updated)
      setSavedEvents(loadSessions())
    }
  }, [session])

  useEffect(() => () => stream?.getTracks().forEach((track) => track.stop()), [stream])
  useEffect(() => () => {
    if (pendingModalTimer.current !== null) window.clearTimeout(pendingModalTimer.current)
  }, [])

  const showBanner = (message: string) => {
    setBanner(message)
    window.setTimeout(() => setBanner(''), 3600)
  }

  const requestCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionStatus('unavailable')
      return
    }
    setPermissionStatus('requesting')
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 960 } },
        audio: false,
      })
      setStream(cameraStream)
      setPermissionStatus('idle')
      setSession((current) => current ? { ...current, cameraGranted: true } : current)
      setScreen('event')
    } catch (error) {
      setPermissionStatus(classifyCameraFailure(error))
    }
  }

  const openManual = () => {
    if (pendingPerson) return
    setScreen('event')
    setAdditionSource('manual')
    setPersonModal(true)
  }

  const triggerGesture = useCallback(() => {
    if (!session || pendingPerson || personModal) return
    const order = session.people.length + 1
    const draft: Person = {
      id: crypto.randomUUID(),
      name: '',
      note: '',
      order,
      x: .12 + Math.random() * .76,
      y: .82,
      direction: Math.random() > .5 ? 1 : -1,
      speed: .65 + Math.random() * .7,
      state: 'arriving',
      accessory: accessoryOptions[Math.floor(Math.random() * accessoryOptions.length)],
      createdAt: Date.now(),
    }
    setAdditionSource('gesture')
    setPendingPerson(draft)
    pendingModalTimer.current = window.setTimeout(() => {
      setPersonModal(true)
      pendingModalTimer.current = null
    }, 1200)
  }, [pendingPerson, personModal, session])

  const addPerson = (name: string, note: string, photo?: string) => {
    if (!session) return
    const order = session.people.length + 1
    const draft = additionSource === 'gesture' && pendingPerson ? pendingPerson : null
    const person: Person = {
      id: draft?.id ?? crypto.randomUUID(),
      name: name || `Friend ${session.people.filter((person) => /^Friend \d+$/.test(person.name)).length + 1}`,
      note,
      photo,
      order,
      x: draft?.x ?? .12 + Math.random() * .76,
      y: .82,
      direction: draft?.direction ?? (Math.random() > .5 ? 1 : -1),
      speed: draft?.speed ?? .65 + Math.random() * .7,
      state: 'arriving',
      accessory: draft?.accessory ?? accessoryOptions[Math.floor(Math.random() * accessoryOptions.length)],
      createdAt: draft ? Date.now() - 1200 : Date.now(),
    }
    setSession({ ...session, people: [...session.people, person] })
    setPendingPerson(null)
    setPersonModal(false)
    setCooldownUntil(Date.now() + 800)
    setArrivalMessage(`${person.name} joined your crowd!`)
    setSmallConfetti(true)
    navigator.vibrate?.([25, 35, 35])
    window.setTimeout(() => setArrivalMessage(''), 3400)
    window.setTimeout(() => setSmallConfetti(false), 1200)
    const encouragement = milestone(order, session.goal)
    if (encouragement) window.setTimeout(() => showBanner(encouragement), 500)
  }

  const closeModal = () => {
    if (additionSource === 'gesture' && pendingPerson) {
      const leaving = pendingPerson
      setDeparting({ person: leaving, since: Date.now() })
      setPendingPerson(null)
      window.setTimeout(() => setDeparting((current) => current?.person.id === leaving.id ? null : current), 750)
    }
    setPersonModal(false)
    setCooldownUntil(Date.now() + 800)
  }

  const resetEvent = () => {
    if (!window.confirm('Delete this event and its crowd? This cannot be undone.')) return
    stream?.getTracks().forEach((track) => track.stop())
    if (pendingModalTimer.current !== null) window.clearTimeout(pendingModalTimer.current)
    pendingModalTimer.current = null
    setStream(null)
    setPendingPerson(null)
    setDeparting(null)
    if (session) deleteSession(session.id)
    setSession(null)
    setSavedEvents(loadSessions())
    setScreen('setup')
    setSelected(null)
  }

  const startNewEvent = () => {
    stream?.getTracks().forEach((track) => track.stop())
    if (pendingModalTimer.current !== null) window.clearTimeout(pendingModalTimer.current)
    pendingModalTimer.current = null
    setStream(null)
    setPendingPerson(null)
    setDeparting(null)
    deactivateSession()
    setSavedEvents(loadSessions())
    setSession(null)
    setSelected(null)
    setScreen('setup')
  }

  if (screen === 'setup') {
    return (
      <SetupScreen
        savedEvents={savedEvents}
        onStart={(eventName, goal) => {
          const now = Date.now()
          const next: EventSession = {
            id: crypto.randomUUID(),
            eventName,
            goal,
            people: [],
            celebrationShown: false,
            cameraGranted: false,
            startedAt: now,
            updatedAt: now,
          }
          setSession(next)
          saveSession(next)
          setScreen('permission')
        }}
        onEdit={(saved) => {
          saveSession(saved)
          setSession(saved)
          setSelected(null)
          setScreen('event')
        }}
        onDelete={(saved) => {
          if (!window.confirm(`Delete “${saved.eventName}” and its crowd? This cannot be undone.`)) return
          deleteSession(saved.id)
          setSavedEvents(loadSessions())
        }}
      />
    )
  }

  if (!session) return null

  if (screen === 'permission') {
    return <CameraPermission status={permissionStatus} onOpen={() => void requestCamera()} onManual={openManual} />
  }

  if (screen === 'recap') {
    return <RecapScreen eventName={session.eventName} goal={session.goal} people={session.people} onReturn={() => setScreen('event')} onNew={startNewEvent} />
  }

  const celebrationOpen = session.people.length >= session.goal && !session.celebrationShown

  return (
    <main className="app-shell">
      {banner && <div className="milestone-banner" role="status">{banner}</div>}
      {arrivalMessage && <div className="arrival-banner" role="status"><span>+1</span>{arrivalMessage}</div>}
      {smallConfetti && <Confetti />}
      <CourageHeader eventName={session.eventName} count={session.people.length} goal={session.goal} onReset={resetEvent} />
      <div className="experience-grid">
        {stream ? (
          <GestureCamera
            stream={stream}
            paused={Boolean(pendingPerson) || personModal || celebrationOpen}
            cooldownUntil={cooldownUntil}
            onGesture={triggerGesture}
            onManual={() => {
              if (pendingPerson) return
              setAdditionSource('manual')
              setPersonModal(true)
            }}
          />
        ) : (
          <section className="camera-card no-camera">
            <div className="no-camera-figure" aria-hidden="true"><span /><i /></div>
            <p className="eyebrow">Manual mode</p>
            <h2>Your courage still counts.</h2>
            <p>The camera is off. Add each new hello with the button below, or try opening the camera.</p>
            <button className="primary-button" onClick={() => void requestCamera()}>Open Camera</button>
            <button className="manual-button" onClick={() => {
              setAdditionSource('manual')
              setPersonModal(true)
            }}><Plus size={17} /> Add Person Manually</button>
          </section>
        )}
        <StickWorld
          people={session.people}
          selectedId={selected?.id}
          celebration={celebrationOpen}
          pendingPerson={pendingPerson}
          freezePending={personModal && additionSource === 'gesture'}
          departing={departing}
          onSelect={setSelected}
        />
      </div>
      <button className="end-event-button" onClick={() => {
        if (pendingModalTimer.current !== null) window.clearTimeout(pendingModalTimer.current)
        pendingModalTimer.current = null
        setPendingPerson(null)
        setDeparting(null)
        setPersonModal(false)
        setScreen('recap')
      }}><Flag size={17} /> End Event & See Recap</button>
      <p className="footer-note">Your names, notes and photos stay on this device.</p>
      <PersonModal open={personModal} onConfirm={addPerson} onCancel={closeModal} />
      <CharacterDetails
        person={selected}
        eventName={session.eventName}
        onClose={() => setSelected(null)}
        onSave={(id, name, note, photo) => {
          setSession({ ...session, people: session.people.map((person) => person.id === id ? { ...person, name, note, photo } : person) })
          setSelected(null)
        }}
      />
      {celebrationOpen && (
        <GoalCelebration count={session.people.length} onContinue={() => setSession({ ...session, celebrationShown: true })} />
      )}
    </main>
  )
}
