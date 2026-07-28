import { beforeEach, describe, expect, it } from 'vitest'
import type { EventSession } from '../types'
import {
  deactivateSession,
  deleteSession,
  loadSession,
  loadSessions,
  saveSession,
} from './storage'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() { return this.values.size }
  clear() { this.values.clear() }
  getItem(key: string) { return this.values.get(key) ?? null }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  removeItem(key: string) { this.values.delete(key) }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

function event(id: string, eventName: string, people = 0): EventSession {
  return {
    id,
    eventName,
    goal: 10,
    people: Array.from({ length: people }, (_, index) => ({
      id: `${id}-person-${index}`,
      name: `Friend ${index + 1}`,
      note: '',
      order: index + 1,
      x: .5,
      y: .8,
      direction: 1,
      speed: 1,
      state: 'standing',
      accessory: 'none',
      createdAt: index + 1,
    })),
    celebrationShown: false,
    cameraGranted: false,
    startedAt: 100,
    updatedAt: 100,
  }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: new MemoryStorage(),
  })
})

describe('saved event library', () => {
  it('keeps previous events when a new event is saved', () => {
    saveSession(event('event-a', 'First Event', 2))
    saveSession(event('event-b', 'Second Event'))

    expect(loadSessions().map((session) => session.eventName)).toEqual(['First Event', 'Second Event'])
  })

  it('can leave an event, reopen it, and keep adding people', () => {
    const original = event('event-a', 'Community Night', 2)
    saveSession(original)
    deactivateSession()
    expect(loadSession()).toBeNull()

    saveSession({ ...original, people: [...original.people, original.people[0]], updatedAt: 200 })
    expect(loadSession()?.people).toHaveLength(3)
  })

  it('deletes only the selected saved event', () => {
    saveSession(event('event-a', 'Keep Me'))
    saveSession(event('event-b', 'Delete Me'))
    deleteSession('event-b')

    expect(loadSessions().map((session) => session.eventName)).toEqual(['Keep Me'])
  })

  it('migrates the original single saved event without losing its crowd', () => {
    const legacy = event('', 'Legacy Event', 2)
    localStorage.setItem('tiny-courage-session-v1', JSON.stringify({ ...legacy, id: undefined, updatedAt: undefined }))

    const migrated = loadSessions()
    expect(migrated).toHaveLength(1)
    expect(migrated[0].eventName).toBe('Legacy Event')
    expect(migrated[0].people).toHaveLength(2)
    expect(migrated[0].id).toBeTruthy()
  })
})
