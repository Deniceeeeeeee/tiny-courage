export type Accessory = 'none'
export type AnimationState =
  | 'arriving'
  | 'standing'
  | 'walking'
  | 'waving'
  | 'sitting'
  | 'looking'
  | 'lying'
  | 'cheering'
  | 'talking'
  | 'highfive'

export interface Person {
  id: string
  name: string
  note: string
  order: number
  x: number
  y: number
  direction: -1 | 1
  speed: number
  state: AnimationState
  accessory: Accessory
  createdAt: number
}

export interface EventSession {
  id: string
  eventName: string
  goal: number
  people: Person[]
  celebrationShown: boolean
  cameraGranted: boolean
  startedAt: number
  updatedAt: number
}

export type AppScreen = 'setup' | 'permission' | 'event' | 'recap'
