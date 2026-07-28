import type { EventSession, Person } from '../types'

const LEGACY_STORAGE_KEY = 'tiny-courage-session-v1'
const EVENTS_STORAGE_KEY = 'tiny-courage-events-v2'
const ACTIVE_EVENT_KEY = 'tiny-courage-active-event-v2'

function isSession(value: unknown): value is EventSession {
  if (!value || typeof value !== 'object') return false
  const session = value as Partial<EventSession>
  return Boolean(session.eventName && Array.isArray(session.people))
}

function normalizePerson(person: Person): Person {
  return {
    ...person,
    accessory: 'none',
  }
}

function normalizeSession(session: EventSession): EventSession {
  return {
    ...session,
    id: session.id || crypto.randomUUID(),
    people: session.people.map(normalizePerson),
    updatedAt: session.updatedAt || session.startedAt || Date.now(),
  }
}

function writeSessions(sessions: EventSession[]): void {
  localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(sessions))
}

export function loadSessions(): EventSession[] {
  try {
    const savedValue = localStorage.getItem(EVENTS_STORAGE_KEY)
    if (savedValue) {
      const parsed = JSON.parse(savedValue) as unknown
      if (!Array.isArray(parsed)) return []
      return parsed.filter(isSession).map(normalizeSession).sort((a, b) => b.updatedAt - a.updatedAt)
    }

    const legacyValue = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!legacyValue) return []
    const legacy = JSON.parse(legacyValue) as EventSession
    if (!isSession(legacy)) return []
    const migrated = normalizeSession(legacy)
    writeSessions([migrated])
    localStorage.setItem(ACTIVE_EVENT_KEY, migrated.id)
    localStorage.removeItem(LEGACY_STORAGE_KEY)
    return [migrated]
  } catch {
    return []
  }
}

export function loadSession(): EventSession | null {
  const sessions = loadSessions()
  const activeId = localStorage.getItem(ACTIVE_EVENT_KEY)
  return sessions.find((session) => session.id === activeId) ?? null
}

export function saveSession(session: EventSession): void {
  const normalized = normalizeSession(session)
  const sessions = loadSessions()
  const existingIndex = sessions.findIndex((saved) => saved.id === normalized.id)
  if (existingIndex >= 0) sessions[existingIndex] = normalized
  else sessions.push(normalized)
  writeSessions(sessions)
  localStorage.setItem(ACTIVE_EVENT_KEY, normalized.id)
}

export function deleteSession(id: string): void {
  writeSessions(loadSessions().filter((session) => session.id !== id))
  if (localStorage.getItem(ACTIVE_EVENT_KEY) === id) {
    localStorage.removeItem(ACTIVE_EVENT_KEY)
  }
}

export function deactivateSession(): void {
  localStorage.removeItem(ACTIVE_EVENT_KEY)
}
