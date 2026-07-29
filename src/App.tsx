import { useCallback, useEffect, useRef, useState } from 'react'
import type { User } from '@supabase/supabase-js'
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
import GoogleLogin from './components/GoogleLogin'
import GuestTrialLogin from './components/GuestTrialLogin'
import { supabase } from './lib/supabase'
import {
  deactivateSession,
  deleteSession,
  loadSession,
  loadSessions,
  saveSession,
} from './utils/storage'
import { classifyCameraFailure } from './utils/camera'
import type { Accessory, AppScreen, EventSession, Person } from './types'

const accessoryOptions: Accessory[] = ['none']
const GUEST_TRIAL_KEY = 'tiny-courage-guest-trial-used'

function milestone(count: number, goal: number) {
  if (count === 1) return 'The first hello is always the hardest.'
  if (count === Math.ceil(goal / 2)) {
    return 'You’re halfway there. Your little crowd is growing.'
  }
  if (count === goal - 1) return 'Just one more courageous hello.'
  return ''
}

export default function App() {
  const restored = useRef(loadSession())

  const [session, setSession] = useState<EventSession | null>(restored.current)
  const [savedEvents, setSavedEvents] = useState<EventSession[]>(() => loadSessions())
  const [screen, setScreen] = useState<AppScreen>(restored.current ? 'event' : 'setup')
  const [permissionStatus, setPermissionStatus] = useState<
    'idle' | 'requesting' | 'denied' | 'unavailable'
  >('idle')
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

  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [guestLoginOpen, setGuestLoginOpen] = useState(false)
  const [guestTrialUsed, setGuestTrialUsed] = useState(
    () => localStorage.getItem(GUEST_TRIAL_KEY) === 'true',
  )

  const pendingModalTimer = useRef<number | null>(null)
  const postLoginAction = useRef<'none' | 'new-event'>('none')

  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setUser(data.session?.user ?? null)
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setUser(nextSession?.user ?? null)
      setAuthLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) return

    setGuestLoginOpen(false)

    if (postLoginAction.current === 'new-event') {
      postLoginAction.current = 'none'
      window.setTimeout(() => {
        startNewEvent()
      }, 0)
    }
  }, [user])

  useEffect(() => {
    if (!session) return

    const updated = { ...session, updatedAt: Date.now() }
    saveSession(updated)
    setSavedEvents(loadSessions())
  }, [session])

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [stream])

  useEffect(() => {
    return () => {
      if (pendingModalTimer.current !== null) {
        window.clearTimeout(pendingModalTimer.current)
      }
    }
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
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
        audio: false,
      })

      setStream(cameraStream)
      setPermissionStatus('idle')
      setSession((current) =>
        current ? { ...current, cameraGranted: true } : current,
      )
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
      x: 0.12 + Math.random() * 0.76,
      y: 0.82,
      direction: Math.random() > 0.5 ? 1 : -1,
      speed: 0.65 + Math.random() * 0.7,
      state: 'arriving',
      accessory:
        accessoryOptions[Math.floor(Math.random() * accessoryOptions.length)],
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
    const draft =
      additionSource === 'gesture' && pendingPerson ? pendingPerson : null

    const person: Person = {
      id: draft?.id ?? crypto.randomUUID(),
      name:
        name ||
        `Friend ${
          session.people.filter((item) => /^Friend \d+$/.test(item.name)).length +
          1
        }`,
      note,
      photo,
      order,
      x: draft?.x ?? 0.12 + Math.random() * 0.76,
      y: 0.82,
      direction: draft?.direction ?? (Math.random() > 0.5 ? 1 : -1),
      speed: draft?.speed ?? 0.65 + Math.random() * 0.7,
      state: 'arriving',
      accessory:
        draft?.accessory ??
        accessoryOptions[Math.floor(Math.random() * accessoryOptions.length)],
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
    if (encouragement) {
      window.setTimeout(() => showBanner(encouragement), 500)
    }
  }

  const closeModal = () => {
    if (additionSource === 'gesture' && pendingPerson) {
      const leaving = pendingPerson
      setDeparting({ person: leaving, since: Date.now() })
      setPendingPerson(null)

      window.setTimeout(() => {
        setDeparting((current) =>
          current?.person.id === leaving.id ? null : current,
        )
      }, 750)
    }

    setPersonModal(false)
    setCooldownUntil(Date.now() + 800)
  }

  const clearLiveEventState = () => {
    stream?.getTracks().forEach((track) => track.stop())

    if (pendingModalTimer.current !== null) {
      window.clearTimeout(pendingModalTimer.current)
    }

    pendingModalTimer.current = null
    setStream(null)
    setPendingPerson(null)
    setDeparting(null)
    setPersonModal(false)
    setSelected(null)
  }

  const resetEvent = () => {
    if (!window.confirm('Delete this event and its crowd? This cannot be undone.')) {
      return
    }

    clearLiveEventState()

    if (session) {
      deleteSession(session.id)
    }

    setSession(null)
    setSavedEvents(loadSessions())
    setScreen('setup')
  }

  const startNewEvent = () => {
    clearLiveEventState()
    deactivateSession()
    setSavedEvents(loadSessions())
    setSession(null)
    setScreen('setup')
  }

  const requestNewEvent = () => {
    if (!user && guestTrialUsed) {
      postLoginAction.current = 'new-event'
      setGuestLoginOpen(true)
      return
    }

    startNewEvent()
  }

  const finishEvent = () => {
    if (pendingModalTimer.current !== null) {
      window.clearTimeout(pendingModalTimer.current)
    }

    pendingModalTimer.current = null
    setPendingPerson(null)
    setDeparting(null)
    setPersonModal(false)
    setScreen('recap')

    if (!user) {
      localStorage.setItem(GUEST_TRIAL_KEY, 'true')
      setGuestTrialUsed(true)

      window.setTimeout(() => {
        setGuestLoginOpen(true)
      }, 650)
    }
  }

  const startEvent = (eventName: string, goal: number) => {
    if (!user && guestTrialUsed) {
      postLoginAction.current = 'new-event'
      setGuestLoginOpen(true)
      return
    }

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
  }

  if (screen === 'setup') {
    return (
      <div className="setup-auth-shell">
        <section className="auth-panel">
          {authLoading ? (
            <p className="auth-status">Checking your account...</p>
          ) : user ? (
            <div className="signed-in-row">
              <div>
                <p className="auth-label">Signed in as</p>
                <strong>
                  {user.user_metadata?.full_name ??
                    user.user_metadata?.name ??
                    user.email}
                </strong>
              </div>

              <button
                type="button"
                className="auth-signout-button"
                onClick={() => void supabase.auth.signOut()}
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="signed-out-row">
              <div>
                <p className="auth-label">Sign in to explore more</p>
                <p className="auth-description">
                  Save your events and create more Tiny Courage moments.
                </p>
              </div>

              <GoogleLogin />
            </div>
          )}
        </section>

        <SetupScreen
          savedEvents={savedEvents}
          onStart={startEvent}
          onEdit={(saved) => {
            saveSession(saved)
            setSession(saved)
            setSelected(null)
            setScreen('event')
          }}
          onDelete={(saved) => {
            if (
              !window.confirm(
                `Delete “${saved.eventName}” and its crowd? This cannot be undone.`,
              )
            ) {
              return
            }

            deleteSession(saved.id)
            setSavedEvents(loadSessions())
          }}
        />

        <GuestTrialLogin
          open={guestLoginOpen}
          onClose={() => {
            postLoginAction.current = 'none'
            setGuestLoginOpen(false)
          }}
        />
      </div>
    )
  }

  if (!session) return null

  if (screen === 'permission') {
    return (
      <CameraPermission
        status={permissionStatus}
        onOpen={() => void requestCamera()}
        onManual={openManual}
      />
    )
  }

  if (screen === 'recap') {
    return (
      <>
        <RecapScreen
          eventName={session.eventName}
          goal={session.goal}
          people={session.people}
          onReturn={() => setScreen('event')}
          onNew={requestNewEvent}
        />

        <GuestTrialLogin
          open={guestLoginOpen}
          onClose={() => {
            postLoginAction.current = 'none'
            setGuestLoginOpen(false)
          }}
        />
      </>
    )
  }

  const celebrationOpen =
    session.people.length >= session.goal && !session.celebrationShown

  return (
    <main className="app-shell">
      {banner && (
        <div className="milestone-banner" role="status">
          {banner}
        </div>
      )}

      {arrivalMessage && (
        <div className="arrival-banner" role="status">
          <span>+1</span>
          {arrivalMessage}
        </div>
      )}

      {smallConfetti && <Confetti />}

      <CourageHeader
        eventName={session.eventName}
        count={session.people.length}
        goal={session.goal}
        onReset={resetEvent}
      />

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
            <div className="no-camera-figure" aria-hidden="true">
              <span />
              <i />
            </div>

            <p className="eyebrow">Manual mode</p>
            <h2>Your courage still counts.</h2>
            <p>
              The camera is off. Add each new hello with the button below, or
              try opening the camera.
            </p>

            <button
              className="primary-button"
              onClick={() => void requestCamera()}
            >
              Open Camera
            </button>

            <button
              className="manual-button"
              onClick={() => {
                setAdditionSource('manual')
                setPersonModal(true)
              }}
            >
              <Plus size={17} /> Add Person Manually
            </button>
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

      <button className="end-event-button" onClick={finishEvent}>
        <Flag size={17} /> End Event & See Recap
      </button>

      <p className="footer-note">
        Guest events stay on this device until you sign in.
      </p>

      <PersonModal
        open={personModal}
        onConfirm={addPerson}
        onCancel={closeModal}
      />

      <CharacterDetails
        person={selected}
        eventName={session.eventName}
        onClose={() => setSelected(null)}
        onSave={(id, name, note, photo) => {
          setSession({
            ...session,
            people: session.people.map((person) =>
              person.id === id ? { ...person, name, note, photo } : person,
            ),
          })
          setSelected(null)
        }}
      />

      {celebrationOpen && (
        <GoalCelebration
          count={session.people.length}
          onContinue={() =>
            setSession({ ...session, celebrationShown: true })
          }
        />
      )}
    </main>
  )
}
